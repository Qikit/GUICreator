@echo off
title MC Menu Designer
echo Starting MC Menu Designer...
echo.

where node >nul 2>nul
if %errorlevel%==0 (
    echo Opening http://localhost:8765
    start http://localhost:8765
    node -e "const h=require('http'),f=require('fs'),p=require('path'),M={'.html':'text/html;charset=utf-8','.js':'application/javascript','.json':'application/json','.png':'image/png','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.css':'text/css'};h.createServer((q,r)=>{let fp=p.join('.',decodeURIComponent(q.url==='/'?'/menu-designer.html':q.url));if(!f.existsSync(fp)){r.writeHead(404);r.end();return}r.writeHead(200,{'Content-Type':M[p.extname(fp)]||'application/octet-stream'});f.createReadStream(fp).pipe(r)}).listen(8765,()=>console.log('Server: http://localhost:8765 (Ctrl+C to stop)'))"
    goto end
)

where python >nul 2>nul
if %errorlevel%==0 (
    echo Opening http://localhost:8765
    start http://localhost:8765
    python -m http.server 8765
    goto end
)

where php >nul 2>nul
if %errorlevel%==0 (
    echo Opening http://localhost:8765
    start http://localhost:8765
    php -S localhost:8765
    goto end
)

echo ERROR: Node.js, Python or PHP required.
echo Install Node.js from https://nodejs.org
pause

:end
