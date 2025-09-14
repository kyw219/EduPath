import openai
import pymysql
from dotenv import load_dotenv
import os
from typing import List, Dict

# 加载环境变量
load_dotenv('../.env')

# 配置
client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# 数据库连接
def get_db_connection():
    return pymysql.connect(
        host=os.getenv('TIDB_HOST'),
        port=int(os.getenv('TIDB_PORT', 4000)),
        user=os.getenv('TIDB_USER'),
        password=os.getenv('TIDB_PASSWORD'),
        database=os.getenv('TIDB_DATABASE'),
        charset='utf8mb4',
        ssl={'check_hostname': False, 'verify_mode': 0}
    )

# 学生信息向量化
def vectorize_student_profile(student_info: str) -> List[float]:
    """将学生信息向量化"""
    print(f"🔄 向量化学生信息...")
    
    response = client.embeddings.create(
        input=student_info,
        model="text-embedding-ada-002"
    )
    
    return response.data[0].embedding

# 优化版匹配学校项目 - 使用原生SQL向量搜索
def match_schools_optimized(student_info: str, top_k: int = 10, country_filter: str = None, ranking_limit: int = None) -> List[Dict]:
    """
    使用TiDB原生向量搜索匹配最适合的学校项目
    
    Args:
        student_info: 学生背景信息描述
        top_k: 返回前k个匹配结果
        country_filter: 国家过滤器 (可选)
        ranking_limit: 排名限制，只考虑排名前N的学校 (可选)
    
    Returns:
        匹配结果列表
    """
    
    # 1. 向量化学生信息
    print("🔄 步骤1: 向量化学生信息...")
    student_vector = vectorize_student_profile(student_info)
    print(f"✅ 向量化完成，维度: {len(student_vector)}")
    
    # 2. 使用原生SQL向量搜索
    print("🔄 步骤2: 执行向量搜索...")
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cursor:
            # 构建SQL查询
            sql = """
                SELECT 
                    id, school_name, program_name, country_region, 
                    qs_ranking, specific_field, degree_type, duration,
                    program_details,
                    VEC_COSINE_DISTANCE(embedding, %s) AS similarity_score
                FROM schools 
                WHERE 1=1
            """
            
            params = [str(student_vector)]
            
            # 添加过滤条件
            if country_filter:
                sql += " AND country_region = %s"
                params.append(country_filter)
                print(f"🔍 应用国家过滤器: {country_filter}")
            
            if ranking_limit:
                sql += " AND qs_ranking <= %s"
                params.append(ranking_limit)
                print(f"🔍 应用排名限制: 前{ranking_limit}名")
            
            # 按相似度排序并限制结果数量
            sql += " ORDER BY similarity_score ASC LIMIT %s"
            params.append(top_k)
            
            print("🔄 执行数据库查询...")
            cursor.execute(sql, params)
            results = cursor.fetchall()
            
            print(f"✅ 查询完成，找到 {len(results)} 个匹配项目")
            
    finally:
        conn.close()
    
    # 3. 格式化结果
    matches = []
    for result in results:
        id_val, school_name, program_name, country, ranking, field, degree, duration, details, similarity_score = result
        
        matches.append({
            'id': id_val,
            'school_name': school_name,
            'program_name': program_name,
            'country': country,
            'ranking': ranking,
            'field': field,
            'degree_type': degree,
            'duration': duration,
            'similarity_score': similarity_score,
            'program_details': details[:200] + '...' if len(details) > 200 else details
        })
    
    print("✅ 结果格式化完成")
    return matches

# 主函数
def main():
    print("🚀 优化版学校项目匹配系统")
    print("=" * 60)
    
    # 测试用例
    test_cases = [
        {
            "name": "计算机科学转专业学生",
            "info": "我是一名经济学本科生，GPA 3.6，想转专业到计算机科学。我自学了Python和Java，做过几个Web开发项目，希望申请美国的计算机科学硕士项目。我对人工智能和数据科学特别感兴趣。",
            "filters": {"country_filter": "United States", "ranking_limit": 50}
        },
        {
            "name": "工程背景学生",
            "info": "我是机械工程本科毕业，GPA 3.8，有2年工程师工作经验。希望申请欧洲的先进制造或机器人工程硕士项目，特别关注可持续发展和绿色技术。",
            "filters": {"country_filter": "United Kingdom"}
        },
        {
            "name": "商科学生",
            "info": "我是商务管理本科生，GPA 3.5，有实习经验在金融公司。想申请顶尖商学院的MBA或金融硕士项目，目标是进入投资银行工作。",
            "filters": {"ranking_limit": 20}
        }
    ]
    
    for i, case in enumerate(test_cases, 1):
        print(f"\n🎯 测试案例 {i}: {case['name']}")
        print(f"背景: {case['info']}")
        print(f"过滤条件: {case['filters']}")
        print("\n匹配结果:")
        print("-" * 80)
        
        try:
            start_time = __import__('time').time()
            
            matches = match_schools_optimized(
                case['info'], 
                top_k=5, 
                **case['filters']
            )
            
            end_time = __import__('time').time()
            search_time = end_time - start_time
            
            print(f"⚡ 搜索耗时: {search_time:.2f}秒")
            print()
            
            for j, match in enumerate(matches, 1):
                print(f"{j}. {match['school_name']} - {match['program_name']}")
                print(f"   国家: {match['country']} | 排名: {match['ranking']} | 相似度: {match['similarity_score']:.4f}")
                print(f"   学位: {match['degree_type']} | 时长: {match['duration']}")
                print(f"   详情: {match['program_details']}")
                print()
                
        except Exception as e:
            print(f"❌ 匹配失败: {e}")
            import traceback
            traceback.print_exc()
        
        print("=" * 80)

if __name__ == "__main__":
    main()
