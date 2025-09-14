import openai
import pymysql
import json
import numpy as np
from dotenv import load_dotenv
import os
from typing import List, Dict, Tuple

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

# 计算余弦相似度
def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """计算两个向量的余弦相似度"""
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0
    
    return dot_product / (norm1 * norm2)

# 学生信息向量化
def vectorize_student_profile(student_info: str) -> List[float]:
    """将学生信息向量化"""
    print(f"正在向量化学生信息: {student_info[:100]}...")
    
    response = client.embeddings.create(
        input=student_info,
        model="text-embedding-ada-002"
    )
    
    return response.data[0].embedding

# 匹配学校项目
def match_schools(student_info: str, top_k: int = 10, country_filter: str = None) -> List[Dict]:
    """
    根据学生信息匹配最适合的学校项目
    
    Args:
        student_info: 学生背景信息描述
        top_k: 返回前k个匹配结果
        country_filter: 国家过滤器 (可选)
    
    Returns:
        匹配结果列表
    """
    
    # 1. 向量化学生信息
    print("🔄 步骤1: 开始向量化学生信息...")
    student_vector = vectorize_student_profile(student_info)
    print(f"✅ 学生信息向量化完成，维度: {len(student_vector)}")
    
    # 2. 从数据库获取所有学校项目
    print("🔄 步骤2: 连接数据库...")
    conn = get_db_connection()
    print("✅ 数据库连接成功")
    
    try:
        print("🔄 步骤3: 查询学校项目数据...")
        with conn.cursor() as cursor:
            # 构建查询SQL
            sql = """
                SELECT id, school_name, program_name, country_region, 
                       qs_ranking, specific_field, degree_type, duration,
                       program_details, details_vector
                FROM schools 
                WHERE details_vector IS NOT NULL
            """
            
            if country_filter:
                sql += f" AND country_region = '{country_filter}'"
                print(f"🔍 应用国家过滤器: {country_filter}")
            
            print("🔄 执行SQL查询...")
            cursor.execute(sql)
            print("🔄 获取查询结果...")
            schools = cursor.fetchall()
            
            print(f"✅ 从数据库获取了 {len(schools)} 个项目进行匹配")
            
    except Exception as e:
        print(f"❌ 数据库查询失败: {e}")
        raise
    finally:
        conn.close()
        print("✅ 数据库连接已关闭")
    
    # 3. 计算相似度
    print("🔄 步骤4: 开始计算相似度...")
    matches = []
    total_schools = len(schools)
    
    for i, school in enumerate(schools):
        if i % 50 == 0:  # 每处理50个显示进度
            print(f"📊 进度: {i}/{total_schools} ({i/total_schools*100:.1f}%)")
        
        try:
            school_id, school_name, program_name, country, ranking, field, degree, duration, details, vector_json = school
            
            # 解析向量
            school_vector = json.loads(vector_json)
            
            # 计算相似度
            similarity = cosine_similarity(student_vector, school_vector)
            
            matches.append({
                'id': school_id,
                'school_name': school_name,
                'program_name': program_name,
                'country': country,
                'ranking': ranking,
                'field': field,
                'degree_type': degree,
                'duration': duration,
                'similarity_score': similarity,
                'program_details': details[:200] + '...' if len(details) > 200 else details
            })
            
        except Exception as e:
            print(f"❌ 处理第{i}个项目时出错 ({school_name if 'school_name' in locals() else 'unknown'}): {e}")
            continue
    
    print(f"✅ 相似度计算完成，共处理 {len(matches)} 个项目")
    
    # 4. 按相似度排序
    print("🔄 步骤5: 排序结果...")
    matches.sort(key=lambda x: x['similarity_score'], reverse=True)
    print(f"✅ 排序完成，返回前 {top_k} 个结果")
    
    return matches[:top_k]

# 主函数
def main():
    print("🎓 学校项目匹配系统")
    print("=" * 50)
    
    # 示例学生信息
    student_profiles = [
        {
            "name": "计算机科学转专业学生",
            "info": "我是一名经济学本科生，GPA 3.6，想转专业到计算机科学。我自学了Python和Java，做过几个Web开发项目，希望申请美国的计算机科学硕士项目。我对人工智能和数据科学特别感兴趣。"
        },
        {
            "name": "工程背景学生",
            "info": "我是机械工程本科毕业，GPA 3.8，有2年工程师工作经验。希望申请欧洲的先进制造或机器人工程硕士项目，特别关注可持续发展和绿色技术。"
        },
        {
            "name": "商科学生",
            "info": "我是商务管理本科生，GPA 3.5，有实习经验在金融公司。想申请顶尖商学院的MBA或金融硕士项目，目标是进入投资银行工作。"
        }
    ]
    
    for profile in student_profiles:
        print(f"\n🔍 匹配学生: {profile['name']}")
        print(f"背景: {profile['info']}")
        print("\n匹配结果:")
        print("-" * 80)
        
        try:
            print("🚀 开始匹配...")
            matches = match_schools(profile['info'], top_k=5)
            print("🎉 匹配完成！")
            
            for i, match in enumerate(matches, 1):
                print(f"{i}. {match['school_name']} - {match['program_name']}")
                print(f"   国家: {match['country']} | 排名: {match['ranking']} | 相似度: {match['similarity_score']:.3f}")
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
