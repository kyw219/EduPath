# School Data Upload Script

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file with your credentials:
```
OPENAI_API_KEY=your_openai_api_key_here
TIDB_HOST=your_tidb_host
TIDB_PORT=4000
TIDB_USER=your_username
TIDB_PASSWORD=your_password
TIDB_DATABASE=edupath
```

3. Make sure TiDB table exists:
```sql
CREATE TABLE schools (
    id INT PRIMARY KEY,
    school_name VARCHAR(255),
    qs_ranking INT,
    country_region VARCHAR(100),
    broad_category VARCHAR(100),
    specific_field VARCHAR(100),
    program_name VARCHAR(255),
    program_url TEXT,
    graduate_school_url TEXT,
    degree_type VARCHAR(50),
    duration VARCHAR(50),
    crawl_status VARCHAR(50),
    language_requirements TEXT,
    program_details TEXT,
    details_vector JSON
);
```

## Usage

```bash
python upload.py
```
