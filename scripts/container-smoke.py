"""Build image first: docker build -t apex-radio-team:local ."""
import os, secrets, subprocess, time
suffix=secrets.token_hex(5)
name='apex-check-'+suffix
volume=name+'-data'
environment={**os.environ,'SETUP_TOKEN':secrets.token_hex(32)}
def docker(*args,**kwargs):
    return subprocess.run(['docker',*args],check=True,env=environment,capture_output=True,text=True,**kwargs)
try:
    docker('run','-d','--name',name,'-e','SETUP_TOKEN','-v',volume+':/app/data','apex-radio-team:local')
    script="""
const base='http://127.0.0.1:3000';
let ready=false;
for(let i=0;i<40;i++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{} await new Promise(r=>setTimeout(r,100));}
if(!ready)throw new Error('Server unavailable');
const post=(path,body)=>fetch(base+'/api'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const data={name:'Проверка',email:'test@example.ru',password:'test-password-123'};
if((await post('/setup',data)).status!==403)throw new Error('Unprotected setup');
const response=await post('/setup',{...data,setupToken:process.env.SETUP_TOKEN});
if(response.status!==201)throw new Error('Setup failed');
if(!response.headers.get('set-cookie').includes('; Secure'))throw new Error('Insecure cookie');
if(!response.headers.get('strict-transport-security'))throw new Error('Missing HSTS');
console.log('PASS: Docker, права постоянного тома, код администратора, Secure cookie, HSTS');
"""
    print(docker('exec','-i',name,'node','--input-type=module',input=script).stdout.strip())
    docker('restart',name)
    script="""
for(let i=0;i<40;i++){try{const r=await fetch('http://127.0.0.1:3000/api/status');if(r.ok){if((await r.json()).needsSetup)throw new Error('Data lost');console.log('PASS: аккаунт сохраняется после перезапуска контейнера');process.exit(0);}}catch{}await new Promise(r=>setTimeout(r,100));}process.exit(1);
"""
    print(docker('exec','-i',name,'node','--input-type=module',input=script).stdout.strip())
finally:
    subprocess.run(['docker','rm','-f',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    subprocess.run(['docker','volume','rm',volume],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
