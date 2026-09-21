import sys
import os
import subprocess
import json

def load_env():
    env = os.environ.copy()
    env['NODE_PATH'] = 'node_modules'
    # Read .env first, but do not override existing os.environ variables
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k not in os.environ:
                            env[k] = v
    return env

def main():
    if os.environ.get('NODE_ENV') == 'production' or os.environ.get('VERCEL') == '1':
        print("db_exec.py is a development tool and cannot be executed in production environments.", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) < 2:
        print("Usage: db_exec.py \"SQL STATEMENT\"")
        sys.exit(1)

    sql = sys.argv[1]

    # We can write a quick temp node script to execute this SQL
    node_script = f"""
    const postgres = require('postgres');
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {{
      console.error("DATABASE_URL is not set");
      process.exit(1);
    }}
    const sslOption = connectionString.includes('supabase') || connectionString.includes('neon') || connectionString.includes('aws') ? {{ rejectUnauthorized: false }} : false;
    const sql = postgres(connectionString, {{ ssl: sslOption }});

    async function run() {{
      try {{
        const result = await sql.unsafe(`{sql}`);
        console.log(JSON.stringify(result, null, 2));
      }} catch (err) {{
        console.error(err.message);
        process.exit(1);
      }} finally {{
        await sql.end();
      }}
    }}
    run();
    """

    env = load_env()
    # Debug print actual DATABASE_URL used (excluding credentials)
    db_url = env.get('DATABASE_URL', '')
    if '@' in db_url:
        parts = db_url.split('@', 1)
        print("Using DB host:", parts[1], file=sys.stderr)
    else:
        print("Using DB connection string", file=sys.stderr)

    proc = subprocess.Popen(['node', '-e', node_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
    stdout, stderr = proc.communicate()

    if proc.returncode != 0:
        print("Error executing SQL:", file=sys.stderr)
        print(stderr, file=sys.stderr)
        sys.exit(1)

    print(stdout)

if __name__ == "__main__":
    main()
