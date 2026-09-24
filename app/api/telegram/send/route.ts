import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";

export async function POST(req:NextRequest){
 const token=process.env.TELEGRAM_BOT_TOKEN;
 if(!token)return NextResponse.json({error:"TELEGRAM_BOT_TOKEN is not configured."},{status:503});
 const form=await req.formData();
 const audio=form.get("audio");
 const text=String(form.get("text")||"").trim();
 const chatId=String(form.get("chatId")||"").trim();
 const caption=String(form.get("caption")||"Rapsometeddy Voice Studio");
 if(!chatId)return NextResponse.json({error:"chatId is required."},{status:400});

 let file:File;
 if(audio instanceof File){
   file=audio;
 }else if(text){
   if(text.length>500)return NextResponse.json({error:"Text must be 500 characters or less."},{status:400});
   const tts=await fetch("https://kiprio.com/v1/tts/demo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,lang:"en",slow:false})});
   if(!tts.ok)return NextResponse.json({error:"Server TTS failed ("+tts.status+"). Try again."},{status:502});
   const bytes=await tts.arrayBuffer();
   file=new File([bytes],"rapsometeddy-voice.mp3",{type:"audio/mpeg"});
 }else{
   return NextResponse.json({error:"audio or text is required."},{status:400});
 }

 const tg=new FormData();
 tg.append("chat_id",chatId);
 tg.append("caption",caption);
 tg.append("document",file,file.name||"rapsometeddy-voice.mp3");
 const res=await fetch(`https://api.telegram.org/bot${token}/sendDocument`,{method:"POST",body:tg});
 const data=await res.json().catch(()=>({description:"Telegram returned an invalid response."}));
 return NextResponse.json(data,{status:res.ok?200:502});
}