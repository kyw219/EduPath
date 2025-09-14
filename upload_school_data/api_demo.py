import openai
import pymysql
import json
import uuid
from dotenv import load_dotenv
import os
from typing import List, Dict

# 加载环境变量
load_dotenv('../.env')

# 配置
client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

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

def analyze_chat(chat_history: List[Dict]) -> Dict:
    """
    分析聊天记录，提取用户信息并返回analysis_id
    对应前端: analyzeChat(chatHistory)
    """
    print("🔄 分析聊天记录...")
    
    # 生成session_id
    session_id = str(uuid.uuid4())
    
    # 提取用户信息
    user_messages = [msg['content'] for msg in chat_history if msg['role'] == 'user']
    user_profile = ' '.join(user_messages)
    
    print("🔄 向量化用户档案...")
    # 向量化用户档案
    response = client.embeddings.create(
        input=user_profile,
        model="text-embedding-ada-002"
    )
    profile_vector = response.data[0].embedding
    
    # 存储到数据库
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO user_sessions (
                    session_id, chat_messages, user_profile, 
                    profile_embedding, status
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                session_id,
                json.dumps(chat_history),
                user_profile,
                str(profile_vector),
                'analyzed'
            ))
        conn.commit()
        print(f"✅ 用户会话创建成功: {session_id}")
    finally:
        conn.close()
    
    return {
        "analysis_id": session_id,
        "status": "analyzing", 
        "message": "Analyzing 50+ programs based on your profile..."
    }

def get_schools(analysis_id: str) -> Dict:
    """
    基于analysis_id获取匹配的学校
    对应前端: getSchools(analysisId)
    """
    print(f"🔄 获取学校匹配结果: {analysis_id}")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 获取用户档案向量
            cursor.execute("""
                SELECT profile_embedding FROM user_sessions 
                WHERE session_id = %s
            """, (analysis_id,))
            
            result = cursor.fetchone()
            if not result:
                raise Exception("Session not found")
            
            user_vector = result[0]
            
            print("🔄 执行向量搜索...")
            # 搜索target schools (相似度高的)
            cursor.execute("""
                SELECT 
                    id, school_name, program_name, country_region,
                    qs_ranking, degree_type, duration, program_details,
                    VEC_COSINE_DISTANCE(embedding, %s) AS similarity
                FROM schools 
                ORDER BY similarity ASC 
                LIMIT 3
            """, (user_vector,))
            
            target_results = cursor.fetchall()
            target_schools = []
            for row in target_results:
                target_schools.append({
                    "school": row[1],
                    "program": row[2],
                    "match_score": int((1 - row[8]) * 100),  # 转换为匹配分数
                    "deadline": "2025-01-15",  # 示例数据
                    "requirements": "Basic background sufficient",
                    "tuition": "$43,000",
                    "employment_rate": "92%",
                    "reason": f"Great match for your background in {row[3]}"
                })
            
            # 搜索reach schools (相似度中等，但排名更高的)
            cursor.execute("""
                SELECT 
                    id, school_name, program_name, country_region,
                    qs_ranking, degree_type, duration, program_details,
                    VEC_COSINE_DISTANCE(embedding, %s) AS similarity
                FROM schools 
                WHERE qs_ranking <= 20
                ORDER BY similarity ASC 
                LIMIT 2
            """, (user_vector,))
            
            reach_results = cursor.fetchall()
            reach_schools = []
            for row in reach_results:
                reach_schools.append({
                    "school": row[1],
                    "program": row[2], 
                    "match_score": max(50, int((1 - row[8]) * 100) - 20),  # 降低分数
                    "gaps": ["Advanced Math", "Research Experience"],
                    "suggestions": "Complete prerequisite courses and gain research experience",
                    "deadline": "2025-12-01",
                    "tuition": "$77,000",
                    "requirements": "Strong academic background required",
                    "employment_rate": "98%",
                    "reason": f"Top-tier program at {row[1]}"
                })
            
            # 更新数据库
            schools_data = {
                "target_schools": target_schools,
                "reach_schools": reach_schools
            }
            
            cursor.execute("""
                UPDATE user_sessions 
                SET target_schools = %s, reach_schools = %s
                WHERE session_id = %s
            """, (
                json.dumps(target_schools),
                json.dumps(reach_schools), 
                analysis_id
            ))
            
        conn.commit()
        print(f"✅ 找到 {len(target_schools)} 个目标学校，{len(reach_schools)} 个冲刺学校")
        
    finally:
        conn.close()
    
    return schools_data

def get_timeline(analysis_id: str) -> Dict:
    """
    基于analysis_id生成申请时间线
    对应前端: getTimeline(analysisId)
    """
    print(f"🔄 生成申请时间线: {analysis_id}")
    
    # 生成示例时间线数据
    timeline_data = {
        "timeline": [
            {
                "phase": "Background Building",
                "period": "2025-01 to 2025-03", 
                "color": "#10B981",
                "tasks": [
                    {
                        "task": "Complete Prerequisites",
                        "deadline": "2025-02-15",
                        "status": "pending",
                        "priority": "high",
                        "reason": "Required for target programs",
                        "cost": "$1,200"
                    }
                ]
            },
            {
                "phase": "Application Prep",
                "period": "2025-04 to 2025-08",
                "color": "#3B82F6", 
                "tasks": [
                    {
                        "task": "GRE Preparation & Test",
                        "deadline": "2025-06-15",
                        "status": "upcoming", 
                        "priority": "high",
                        "reason": "Required for most programs",
                        "cost": "$220"
                    }
                ]
            }
        ],
        "key_deadlines": [
            {"date": "2025-01-15", "event": "Target School Applications Due", "type": "application"},
            {"date": "2025-12-01", "event": "Reach School Applications Due", "type": "application"}
        ],
        "total_estimated_cost": "$5,500",
        "total_tasks": 12,
        "completion_rate": 0
    }
    
    # 更新数据库
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE user_sessions 
                SET timeline_data = %s, status = 'completed'
                WHERE session_id = %s
            """, (json.dumps(timeline_data), analysis_id))
        conn.commit()
        print("✅ 时间线生成完成")
    finally:
        conn.close()
    
    return timeline_data

# 演示完整流程
def demo_full_flow():
    print("🚀 演示完整API流程")
    print("=" * 60)
    
    # 模拟前端聊天数据
    chat_history = [
        {"role": "assistant", "content": "Hi! Tell me about your background..."},
        {"role": "user", "content": "我是经济学本科生，GPA 3.6，想转专业到计算机科学。我自学了Python和Java，做过几个Web开发项目，希望申请美国的计算机科学硕士项目。我对人工智能和数据科学特别感兴趣。"},
        {"role": "assistant", "content": "Got it! Any location/budget preferences?"},
        {"role": "user", "content": "我希望在美国，预算在5万美元以内，倾向于西海岸的学校。"}
    ]
    
    try:
        # 步骤1: 分析聊天
        print("\n📝 步骤1: 分析聊天记录")
        analysis_result = analyze_chat(chat_history)
        analysis_id = analysis_result["analysis_id"]
        print(f"Analysis ID: {analysis_id}")
        
        # 步骤2: 获取学校匹配
        print(f"\n🏫 步骤2: 获取学校匹配")
        schools_result = get_schools(analysis_id)
        print(f"目标学校: {len(schools_result['target_schools'])}个")
        print(f"冲刺学校: {len(schools_result['reach_schools'])}个")
        
        # 步骤3: 生成时间线
        print(f"\n📅 步骤3: 生成时间线")
        timeline_result = get_timeline(analysis_id)
        print(f"时间线阶段: {len(timeline_result['timeline'])}个")
        print(f"总任务数: {timeline_result['total_tasks']}")
        
        print("\n🎉 完整流程演示成功！")
        
        # 显示结果摘要
        print("\n📊 结果摘要:")
        print("-" * 40)
        for school in schools_result['target_schools']:
            print(f"🎯 {school['school']} - {school['program']} (匹配度: {school['match_score']}%)")
        
        for school in schools_result['reach_schools']:
            print(f"🚀 {school['school']} - {school['program']} (匹配度: {school['match_score']}%)")
            
    except Exception as e:
        print(f"❌ 演示失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    demo_full_flow()
