import pandas as pd
import openai
import pymysql
import os
from dotenv import load_dotenv
import json

# 加载环境变量 (从项目根目录)
load_dotenv('../.env')

# 配置
client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# 数据库连接
conn = pymysql.connect(
    host=os.getenv('TIDB_HOST'),
    port=int(os.getenv('TIDB_PORT', 4000)),
    user=os.getenv('TIDB_USER'),
    password=os.getenv('TIDB_PASSWORD'),
    database=os.getenv('TIDB_DATABASE'),
    charset='utf8mb4',
    ssl={'check_hostname': False, 'verify_mode': 0}
)

print("Connected to TiDB successfully")

# 读取Excel文件
excel_path = '../data/QS_Top50_Master_Programs_Complete.xlsx'
df = pd.read_excel(excel_path)

print(f"Loaded {len(df)} records from Excel")

# 处理每一行数据
for index, row in df.iterrows():
    try:
        print(f"Processing record {index + 1}/{len(df)}: {row['school_name']}")
        
        # 向量化program_details字段
        program_details = str(row['program_details'])[:8000]  # 截断长文本避免token限制
        
        embedding_response = client.embeddings.create(
            input=program_details,
            model="text-embedding-ada-002"
        )
        embedding_vector = embedding_response.data[0].embedding
        
        # 插入数据库
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO schools (
                    id, school_name, qs_ranking, country_region, broad_category, 
                    specific_field, program_name, program_url, graduate_school_url, 
                    degree_type, duration, crawl_status, language_requirements, 
                    program_details, embedding
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(sql, (
                row['id'],
                row['school_name'],
                row['qs_ranking'],
                row['country_region'],
                row['broad_category'],
                row['specific_field'],
                row['program_name'],
                row['program_url'],
                row['graduate_school_url'],
                row['degree_type'],
                row['duration'],
                row['crawl_status'],
                row['language_requirements'],
                row['program_details'],
                str(embedding_vector)  # 直接存储为VECTOR类型
            ))
        
        conn.commit()
        print(f"✓ Successfully processed: {row['school_name']} - {row['program_name']}")
        
    except Exception as e:
        print(f"✗ Error processing record {index + 1}: {e}")
        conn.rollback()
        continue

conn.close()
print("Upload completed!")
