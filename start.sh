#!/bin/bash
echo "Starting MC Menu Designer..."

if command -v node &>/dev/null; then
    echo "Opening http://localhost:8765"
    (sleep 1 && open http://localhost:8765 2>/dev/null || xdg-open http://localhost:8765 2>/dev/null) &
    node -e "const h=require('http'),f=require('fs'),p=require('path'),M={'.html':'text/html;charset=utf-8','.js':'application/javascript','.json':'application/json','.png':'image/png','.ttf':'font/ttf'};h.createServer((q,r)=>{let fp=p.join('.',decodeURIComponent(q.url==='/'?'/menu-designer.html':q.url));if(!f.existsSync(fp)){r.writeHead(404);r.end();return}r.writeHead(200,{'Content-Type':M[p.extname(fp)]||'application/octet-stream'});f.createReadStream(fp).pipe(r)}).listen(8765,()=>console.log('Server: http://localhost:8765 (Ctrl+C to stop)'))"
elif command -v python3 &>/dev/null; then
    echo "Opening http://localhost:8765"
    (sleep 1 && open http://localhost:8765 2>/dev/null || xdg-open http://localhost:8765 2>/dev/null) &
    python3 -m http.server 8765
elif command -v php &>/dev/null; then
    echo "Opening http://localhost:8765"
    (sleep 1 && open http://localhost:8765 2>/dev/null || xdg-open http://localhost:8765 2>/dev/null) &
    php -S localhost:8765
else
    echo "ERROR: Node.js, Python or PHP required."
    echo "Install Node.js from https://nodejs.org"
fi
