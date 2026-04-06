const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Pratik%4012345@db.kadnlkeekslihosmldoj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function dump() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");

        let sql = '';
        for (const row of res.rows) {
            const table = row.table_name;
            const cols = await pool.query("SELECT column_name, data_type, character_maximum_length, column_default, is_nullable FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position", [table]);
            
            sql += "CREATE TABLE IF NOT EXISTS public." + table + " (\\n";
            const colDefs = cols.rows.map(c => {
                let def = "  " + c.column_name + " " + c.data_type;
                if (c.character_maximum_length) def += "(" + c.character_maximum_length + ")";
                if (c.column_default) def += " DEFAULT " + c.column_default;
                if (c.is_nullable === 'NO') def += " NOT NULL";
                return def;
            });
            sql += colDefs.join(',\\n');
            sql += "\\n);\\n\\n";
        }
        
        fs.writeFileSync('schema_dump.sql', sql);
        console.log('Done.');
    } catch(e) {
        console.error(e);
    } finally {
        pool.end()
    }
}
dump();
