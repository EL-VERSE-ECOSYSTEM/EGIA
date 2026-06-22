import os
import re

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_auth():
    write_file('lib/auth.ts', """import { createClient } from '@neondatabase/neon-js'
if (!process.env.NEXT_PUBLIC_NEON_AUTH_URL) {
  throw new Error('NEXT_PUBLIC_NEON_AUTH_URL is not set')
}
export const auth = createClient({
  auth: { url: process.env.NEXT_PUBLIC_NEON_AUTH_URL },
  dataApi: { url: '' }
})
""")

def fix_table():
    write_file('components/ui/table.tsx', """import * as React from "react"
import { cn } from "@/lib/utils"
const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto"><table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} /></div>
))
Table.displayName = "Table"
const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"
const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
))
TableBody.displayName = "TableBody"
const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
))
TableRow.displayName = "TableRow"
const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...props} />
))
TableHead.displayName = "TableHead"
const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
))
TableCell.displayName = "TableCell"
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
""")

def fix_globally():
    for root, dirs, files in os.walk('.'):
        if any(d in root for d in ['node_modules', '.next', '.git']): continue
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f: content = f.read()
                except: continue
                orig = content
                # named DashboardLayout to default
                content = content.replace('import { DashboardLayout } from', 'import DashboardLayout from')
                # fix DashboardLayout paths
                content = content.replace('@/components/dashboard-layout', '@/components/layout/dashboard-layout')
                # auth session
                content = re.sub(r'auth\.api\.getSession\(\{ headers: await headers\(\) \}\)', 'auth.getSession()', content)
                # pdf-parse
                content = content.replace("import pdf from 'pdf-parse';", "import * as pdf from 'pdf-parse';")
                # ids
                content = re.sub(r'id: Math\.random\(\)\.toString\(36\)\.sub(str|string)\(2, 9\)', 'id: crypto.randomUUID()', content)
                if content != orig:
                    write_file(path, content)

if __name__ == "__main__":
    fix_auth()
    fix_table()
    fix_globally()
