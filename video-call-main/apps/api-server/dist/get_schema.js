"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
const fs_1 = __importDefault(require("fs"));
async function dump() {
    try {
        const res = await db_1.pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE';
        `);
        let sql = '';
        for (const row of res.rows) {
            const table = row.table_name;
            const cols = await db_1.pool.query(`
                SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position;
            `, [table]);
            sql += `CREATE TABLE IF NOT EXISTS public.${table} (\n`;
            const colDefs = cols.rows.map(c => `  ${c.column_name} ${c.data_type}${c.character_maximum_length ? '(' + c.character_maximum_length + ')' : ''} ${c.column_default ? 'DEFAULT ' + c.column_default : ''} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
            sql += colDefs.join(',\n');
            sql += `\n);\n\n`;
        }
        fs_1.default.writeFileSync('schema_dump.sql', sql);
        console.log('Done.');
    }
    catch (e) {
        console.error(e);
    }
    finally {
        db_1.pool.end();
    }
}
dump();
//# sourceMappingURL=get_schema.js.map