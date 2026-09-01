// Enmarca las capturas crudas del iPhone al tamano 6.9" que pide App Store
// (1290x2796), con el mismo estilo que las de Play: fondo carbon, titulo arriba
// y la captura flotante con esquinas redondeadas y sombra.
const sharp=require('c:/Users/lucas/Clic/Clicnet/node_modules/sharp');
const fs=require('fs'), path=require('path');

const SRC='c:/Users/lucas/Clic/clic_app_v1/store-assets/capturas-crudas-ios/';
const OUT='c:/Users/lucas/Clic/clic_app_v1/store-assets/capturas-ios/';
const W=1290, H=2796, FONDO='#26282b';

const SET=[
  {file:'WhatsApp Image 2026-08-31 at 19.03.48.jpeg',      out:'1-home.png',       titulo:'Tu estudio, en tu bolsillo'},
  {file:'WhatsApp Image 2026-08-31 at 19.03.48 (1).jpeg',  out:'2-agenda.png',     titulo:'Reservá en segundos'},
  {file:'WhatsApp Image 2026-08-31 at 19.03.47 (2).jpeg',  out:'3-cuenta.png',     titulo:'Tu plan, siempre al día'},
  {file:'WhatsApp Image 2026-08-31 at 19.03.47 (1).jpeg',  out:'4-novedades.png',  titulo:'No te pierdas nada'},
  {file:'WhatsApp Image 2026-08-31 at 19.03.47.jpeg',      out:'5-perfil.png',     titulo:'Tu credencial, a mano'},
];

const ANCHO_CAP=1010, X=Math.round((W-ANCHO_CAP)/2), Y=470, RADIO=52;
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  for(const it of SET){
    const src=path.join(SRC,it.file);
    if(!fs.existsSync(src)){ console.log('FALTA:', it.file); continue; }

    const cap=await sharp(src).resize({width:ANCHO_CAP}).toBuffer();
    const meta=await sharp(cap).metadata();
    const alto=Math.min(meta.height, H-Y-90);           // recorta abajo si no entra
    const capRec=await sharp(cap).extract({left:0,top:0,width:ANCHO_CAP,height:alto}).toBuffer();

    // esquinas redondeadas
    const mascara=Buffer.from(`<svg width="${ANCHO_CAP}" height="${alto}"><rect width="${ANCHO_CAP}" height="${alto}" rx="${RADIO}" ry="${RADIO}" fill="#fff"/></svg>`);
    const capRedonda=await sharp(capRec).composite([{input:mascara,blend:'dest-in'}]).png().toBuffer();

    // sombra + titulo
    const sombra=Buffer.from(`<svg width="${W}" height="${H}">
      <defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="26"/></filter></defs>
      <rect x="${X+10}" y="${Y+18}" width="${ANCHO_CAP}" height="${alto}" rx="${RADIO}" fill="#000" opacity="0.45" filter="url(#b)"/>
    </svg>`);
    const titulo=Buffer.from(`<svg width="${W}" height="${H}">
      <text x="${W/2}" y="320" text-anchor="middle"
            font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="82" font-weight="700"
            fill="#ffffff">${esc(it.titulo)}</text>
    </svg>`);

    await sharp({create:{width:W,height:H,channels:4,background:FONDO}})
      .composite([{input:sombra},{input:capRedonda,left:X,top:Y},{input:titulo}])
      .png().toFile(path.join(OUT,it.out));
    console.log('✓', it.out, '|', it.titulo, '| captura', ANCHO_CAP+'x'+alto);
  }
})().catch(e=>console.log('ERROR', e.message));
