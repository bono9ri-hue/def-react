import{InternalThemeProvider as Q}from"./index-BGk5q3Fi.js";import{h as ee}from"./shared-9ly1ii20.js";import{r as n,e as te,j as a,u as ne,c as M,F as re}from"./index.html-BoVIvYkW.js";import{u as ie}from"./EnvironmentContext-Cjv51nrv.js";import{e as b}from"./index-D0M7H08z.js";import"./AppearanceContext-8gIN1SFH.js";import"./OptionsContext-WG-C8CCL.js";import"./utils-TXJdVJx7-CO7FM5J0.js";import"./underscore-ClYSgvuy-PzdM3hke.js";import"./makeLocalizable-CqxYGbH4.js";import"./localizationKeys-L95TEc06.js";import"./makeCustomizable-SHScV6v8.js";import"./url-DaPDWryr-vZ2B9-Jn.js";const q="clerk-keyless-prompt-corner",U="1.25rem",B=20,oe=5,se=10,j=.999,ce="transform 350ms cubic-bezier(0.34, 1.2, 0.64, 1)",F="translate3d(0px, 0px, 0)",R={x:0,y:0};function ae(e,r){let o="bottom-right",c=1/0;for(const[l,x]of Object.entries(r)){const E=e.x-x.x,S=e.y-x.y,I=Math.sqrt(E*E+S*S);I<c&&(c=I,o=l)}return o}function le(e){switch(e){case"top-left":return{top:U,left:U};case"top-right":return{top:U,right:U};case"bottom-left":return{bottom:U,left:U};case"bottom-right":return{bottom:U,right:U}}}const ue=["top-left","top-right","bottom-left","bottom-right"];function G(e){if(!(typeof window>"u"))try{localStorage.setItem(q,e)}catch{}}function Z(e){return e/1e3*j/(1-j)}function de(e){if(e.length<2)return R;const r=e[0],o=e[e.length-1],c=o.timestamp-r.timestamp;return c===0?R:{x:(o.position.x-r.position.x)/c*1e3,y:(o.position.y-r.position.y)/c*1e3}}function pe(){const[e,r]=n.useState("bottom-right"),[o,c]=n.useState(!1),[l,x]=n.useState(!1),[E,S]=n.useState(!1),I=n.useRef(null);n.useEffect(()=>{if(typeof window>"u"){S(!0);return}try{const t=localStorage.getItem(q);t&&ue.includes(t)&&r(t)}catch{}finally{S(!0)}},[]);const m=n.useRef(null),u=n.useRef({state:"idle"}),D=n.useRef(null),k=n.useRef({x:0,y:0}),d=n.useRef({x:0,y:0}),O=n.useRef(0),i=n.useRef([]),T=n.useRef(null),L=n.useCallback(t=>{m.current&&(d.current=t,m.current.style.transform=`translate3d(${t.x}px, ${t.y}px, 0)`)},[]),y=n.useCallback(()=>{var s,h;const t=m.current;if(!t)return{"top-left":R,"top-right":R,"bottom-left":R,"bottom-right":R};const f=((s=T.current)==null?void 0:s.width)??t.offsetWidth??0,g=((h=T.current)==null?void 0:h.height)??t.offsetHeight??0,$=window.innerWidth-document.documentElement.clientWidth;function A(w){const v=w.includes("right"),W=w.includes("bottom");return{x:v?window.innerWidth-$-B-f:B,y:W?window.innerHeight-B-g:B}}const P=A(e);function N(w){const v=A(w);return{x:v.x-P.x,y:v.y-P.y}}return{"top-left":N("top-left"),"top-right":N("top-right"),"bottom-left":N("bottom-left"),"bottom-right":N("bottom-right")}},[e]),z=n.useCallback(t=>{const f=m.current;if(!f)return;const g=t.translation.x-d.current.x,$=t.translation.y-d.current.y;if(Math.sqrt(g*g+$*$)<.5){G(t.corner),d.current=R,f.style.transition="",f.style.transform=F,u.current={state:"idle"},x(!1);return}const A=P=>{P.propertyName==="transform"&&(f.removeEventListener("transitionend",A),G(t.corner),t.corner===e?(d.current=R,f.style.transition="",f.style.transform=F,u.current={state:"idle"},x(!1)):(u.current={state:"animating"},I.current=t.corner,r(t.corner)))};f.style.transition=ce,f.addEventListener("transitionend",A),L(t.translation)},[L,e]),p=n.useCallback(()=>{var t,f;u.current.state==="drag"?((t=m.current)==null||t.releasePointerCapture(u.current.pointerId),u.current={state:"animating"}):u.current={state:"idle"},D.current&&(D.current(),D.current=null),i.current=[],c(!1),T.current=null,(f=m.current)==null||f.classList.remove("dev-tools-grabbing"),document.body.style.removeProperty("user-select"),document.body.style.removeProperty("-webkit-user-select")},[]);n.useLayoutEffect(()=>{if(I.current===e){const t=m.current;t&&u.current.state==="animating"&&(d.current=R,t.style.transition="",t.style.transform=F,u.current={state:"idle"},x(!1),I.current=null)}},[e]),n.useLayoutEffect(()=>()=>{p()},[p]);const J=n.useCallback(t=>{const f=t.target;if(f.tagName==="A"||f.closest("a")||t.button!==0)return;const g=m.current;if(!g)return;T.current={width:g.offsetWidth,height:g.offsetHeight},k.current={x:t.clientX,y:t.clientY};const $=g.style.transform;if($&&$!=="none"&&$!==F){const s=$.match(/translate3d\(([^,]+)px,\s*([^,]+)px/);s&&(d.current={x:parseFloat(s[1])||0,y:parseFloat(s[2])||0})}else d.current=R;u.current={state:"press"},i.current=[],O.current=Date.now();const A=s=>{if(u.current.state==="press"){const Y=s.clientX-k.current.x,K=s.clientY-k.current.y;if(Math.sqrt(Y*Y+K*K)<oe)return;u.current={state:"drag",pointerId:s.pointerId};try{g.setPointerCapture(s.pointerId)}catch{}g.style.transition="none",g.classList.add("dev-tools-grabbing"),document.body.style.userSelect="none",document.body.style.webkitUserSelect="none",c(!0),L({x:d.current.x+Y,y:d.current.y+K}),k.current={x:s.clientX,y:s.clientY};return}if(u.current.state!=="drag")return;const h={x:s.clientX,y:s.clientY},w=h.x-k.current.x,v=h.y-k.current.y;k.current=h,L({x:d.current.x+w,y:d.current.y+v});const W=Date.now();W-O.current>=se&&(i.current=[...i.current.slice(-4),{position:h,timestamp:W}],O.current=W)},P=()=>{if(u.current.state==="drag"){const s=de(i.current),h=y();if(p(),!m.current)return;const w=ae({x:d.current.x+Z(s.x),y:d.current.y+Z(s.y)},h),v=h[w];x(!0),z({corner:w,translation:v})}else p()},N=s=>{const h=s.target,w=h.tagName==="BUTTON"||h.closest("button"),v=h.tagName==="A"||h.closest("a");u.current.state==="animating"&&!w&&!v&&(s.preventDefault(),s.stopPropagation())};window.addEventListener("pointermove",A),window.addEventListener("pointerup",P,{once:!0}),window.addEventListener("pointercancel",p,{once:!0}),g.addEventListener("click",N),D.current&&D.current(),D.current=()=>{window.removeEventListener("pointermove",A),window.removeEventListener("pointerup",P),window.removeEventListener("pointercancel",p),g.removeEventListener("click",N)}},[p,L,z,y]);return{corner:e,isDragging:o,cornerStyle:le(e),containerRef:m,onPointerDown:J,preventClick:l,isInitialized:E}}const fe=10*1e3;function me(){const e=te(),r=n.useRef(Date.now()),[,o]=n.useReducer(c=>c+1,0);return n.useEffect(()=>{const c=new AbortController;return window.addEventListener("focus",async()=>{const l=e.__internal_environment;if(!l)return;if(l.authConfig.claimedAt!==null)return c.abort();if(Date.now()<r.current+fe||document.visibilityState!=="visible")return;const x=2;for(let E=0;E<x;E++){const{authConfig:{claimedAt:S}}=await l.fetch();if(r.current=Date.now(),S!==null){o();break}}},{signal:c.signal}),()=>{c.abort()}},[]),ie()}function he(e){try{return e()}catch{return"https://dashboard.clerk.com/last-active"}}const X="18rem",ge="220ms",xe="180ms",H="cubic-bezier(0.2, 0, 0, 1)",C=b`
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background: none;
  border: none;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    avenir next,
    avenir,
    segoe ui,
    helvetica neue,
    helvetica,
    Cantarell,
    Ubuntu,
    roboto,
    noto,
    arial,
    sans-serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  text-decoration: none;
  color: inherit;
  appearance: none;
`;function _(e){return e?ge:xe}const V=b`
  ${C};
  margin: 0.75rem 0 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 1.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.12px;
  color: #fde047;
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.32);
  white-space: nowrap;
  user-select: none;
  cursor: pointer;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30.5%, rgba(0, 0, 0, 0.05) 100%), #454545;
  box-shadow:
    0px 0px 0px 1px rgba(255, 255, 255, 0.04) inset,
    0px 1px 0px 0px rgba(255, 255, 255, 0.04) inset,
    0px 0px 0px 1px rgba(0, 0, 0, 0.12),
    0px 1.5px 2px 0px rgba(0, 0, 0, 0.48),
    0px 0px 4px 0px rgba(243, 107, 22, 0) inset;
  outline: none;
  &:hover {
    background: #4b4b4b;
    transition: background-color 120ms ease-in-out;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
  &:focus-visible {
    outline: 2px solid #6c47ff;
    outline-offset: 2px;
  }
`,be={idle:{triggerWidth:"14.25rem",title:"Configure your application",description:M(re,{children:[a("p",{children:"Temporary API keys are enabled so you can get started immediately."}),a("ul",{children:["Add SSO connections (eg. GitHub)","Set up B2B authentication","Enable MFA"].map(e=>a("li",{children:e},e))}),a("p",{children:"Access the dashboard to customize auth settings and explore Clerk features."})]}),cta:{kind:"link",text:"Configure your application",href:({claimUrl:e})=>e}},userCreated:{triggerWidth:"15.75rem",title:"You've created your first user!",description:a("p",{children:"Head to the dashboard to customize authentication settings, view user info, and explore more features."}),cta:{kind:"link",text:"Configure your application",href:({claimUrl:e})=>e}},claimed:{triggerWidth:"14.25rem",title:"Missing environment keys",description:a("p",{children:"You claimed this application but haven't set keys in your environment. Get them from the Clerk Dashboard."}),cta:{kind:"link",text:"Get API keys",href:({claimUrl:e})=>e}},completed:{triggerWidth:"10.5rem",title:"Your app is ready",description:({appName:e,instanceUrl:r})=>M("p",{children:["Your application"," ",a("a",{href:r,target:"_blank",rel:"noopener noreferrer",children:e})," ","has been configured. You may now customize your settings in the Clerk dashboard."]}),cta:{kind:"action",text:"Dismiss",onClick:e=>{e==null||e().then(()=>{window.location.reload()})}}}};function ye(e,r,o){return r?"completed":e?"claimed":o?"userCreated":"idle"}function we(e,r){const o=be[e],c=typeof o.description=="function"?o.description({appName:r.appName,instanceUrl:r.instanceUrl}):o.description,l=o.cta,x=l.kind==="link"?{kind:"link",text:l.text,href:typeof l.href=="function"?l.href({claimUrl:r.claimUrl,instanceUrl:r.instanceUrl}):l.href}:{kind:"action",text:l.text,onClick:()=>l.onClick(r.onDismiss)};return{state:e,triggerWidth:o.triggerWidth,title:o.title,description:c,cta:x}}function ke(e){const r=n.useId(),o=me(),{isDragging:c,cornerStyle:l,containerRef:x,onPointerDown:E,preventClick:S,isInitialized:I}=pe(),m=!!o.authConfig.claimedAt,u=typeof e.onDismiss=="function"&&m,{isSignedIn:D}=ne(),k=o.displayConfig.applicationName,d=n.useMemo(()=>{if(m)return e.copyKeysUrl;const p=new URL(e.claimUrl);return p.searchParams.append("return_url",window.location.href),p.href},[m,e.copyKeysUrl,e.claimUrl]),O=n.useMemo(()=>he(()=>{const p=ee(e.copyKeysUrl);return new URL(`${p.baseDomain}/apps/${p.appId}/instances/${p.instanceId}/user-authentication/email-phone-username`).href}),[e.copyKeysUrl]),[i,T]=n.useState(!0),L=ye(m,u,!!D),y=n.useMemo(()=>we(L,{appName:k,instanceUrl:O,claimUrl:d,onDismiss:e.onDismiss}),[L,k,O,d,e.onDismiss]),z=y.cta.kind==="link"?a("a",{href:y.cta.href,target:"_blank",rel:"noopener noreferrer",css:V,children:y.cta.text}):a("button",{type:"button",onClick:y.cta.onClick,css:V,children:y.cta.text});return M("div",{ref:x,onPointerDown:i?void 0:E,style:{...l,opacity:I?void 0:0},"data-expanded":i,css:b`
        ${C};
        position: fixed;
        border-radius: ${i?"0.75rem":"2.5rem"};
        background-color: #1f1f1f;
        box-shadow:
          0px 0px 0px 0.5px #2f3037 inset,
          0px 1px 0px 0px rgba(255, 255, 255, 0.08) inset,
          0px 0px 0.8px 0.8px rgba(255, 255, 255, 0.2) inset,
          0px 0px 0px 0px rgba(255, 255, 255, 0.72),
          0px 16px 36px -6px rgba(0, 0, 0, 0.36),
          0px 6px 16px -2px rgba(0, 0, 0, 0.2);
        height: auto;
        isolation: isolate;
        transform: translateZ(0);
        backface-visibility: hidden;
        width: ${i?X:y.triggerWidth};
        cursor: ${c?"grabbing":i?"default":"grab"};
        touch-action: none;
        transition: ${c?"none":I?`width ${_(i)} ${H}, border-radius ${_(i)} cubic-bezier(0.2, 0, 0, 1)`:"none"};

        @media (prefers-reduced-motion: reduce) {
          transition: none;
        }
        &:has(button:focus-visible) {
          outline: 2px solid #6c47ff;
          outline-offset: 2px;
        }
        &::before {
          content: '';
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background-image: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%);
          opacity: 0.16;
          transition: opacity ${_(i)} ${H};

          @media (prefers-reduced-motion: reduce) {
            transition: none;
          }
        }
        &[data-expanded='true']::before,
        &:hover::before {
          opacity: 0.2;
        }
      `,children:[M("button",{type:"button","aria-label":"Keyless prompt","aria-controls":r,"aria-expanded":i,onClick:()=>{S||T(p=>!p)},css:b`
          ${C};
          display: flex;
          align-items: center;
          width: 100%;
          border-radius: inherit;
          padding-inline: 0.75rem;
          gap: 0.25rem;
          height: 2.5rem;
          outline: none;
          cursor: pointer;
          user-select: none;
        `,children:[M("svg",{css:b`
            width: 1rem;
            height: 1rem;
            flex-shrink: 0;
          `,fill:"none",viewBox:"0 0 128 128",children:[a("circle",{cx:"64",cy:"64",r:"20",fill:"#fff"}),a("path",{fill:"#fff",fillOpacity:".4",d:"M99.572 10.788c1.999 1.34 2.17 4.156.468 5.858L85.424 31.262c-1.32 1.32-3.37 1.53-5.033.678A35.846 35.846 0 0 0 64 28c-19.882 0-36 16.118-36 36a35.846 35.846 0 0 0 3.94 16.391c.851 1.663.643 3.712-.678 5.033L16.646 100.04c-1.702 1.702-4.519 1.531-5.858-.468C3.974 89.399 0 77.163 0 64 0 28.654 28.654 0 64 0c13.163 0 25.399 3.974 35.572 10.788Z"}),a("path",{fill:"#fff",d:"M100.04 111.354c1.702 1.702 1.531 4.519-.468 5.858C89.399 124.026 77.164 128 64 128c-13.164 0-25.399-3.974-35.572-10.788-2-1.339-2.17-4.156-.468-5.858l14.615-14.616c1.322-1.32 3.37-1.53 5.033-.678A35.847 35.847 0 0 0 64 100a35.846 35.846 0 0 0 16.392-3.94c1.662-.852 3.712-.643 5.032.678l14.616 14.616Z"})]}),a("span",{css:b`
            ${C};
            font-size: 0.875rem;
            font-weight: 500;
            color: #d9d9d9;
            white-space: nowrap;
          `,children:y.title}),a("svg",{css:b`
            width: 1rem;
            height: 1rem;
            flex-shrink: 0;
            color: #d9d9d9;
            margin-inline-start: auto;
            opacity: ${i?.5:0};
            transition: opacity ${_(i)} ease-out;

            @media (prefers-reduced-motion: reduce) {
              transition: none;
            }
            ${i&&b`
              button:hover & {
                opacity: 1;
              }
            `}
          `,viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",xmlns:"http://www.w3.org/2000/svg",children:a("path",{d:"M3.75 8H12.25",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]}),a("div",{id:r,...!i&&{inert:""},css:b`
          ${C};
          display: grid;
          grid-template-rows: ${i?"1fr":"0fr"};
          transition: grid-template-rows ${_(i)} ${H};

          @media (prefers-reduced-motion: reduce) {
            transition: none;
          }
        `,children:a("div",{css:b`
            ${C};
            min-height: 0;
            overflow: hidden;
          `,children:M("div",{css:b`
              ${C};
              width: ${X};
              padding-inline: 0.75rem;
              padding-block-end: 0.75rem;
              opacity: ${i?1:0};
              transition: opacity ${_(i)} ${H};

              @media (prefers-reduced-motion: reduce) {
                transition: none;
              }
            `,children:[a("div",{css:b`
                ${C};
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                & ul {
                  ${C};
                  list-style: disc;
                  padding-left: 1rem;
                }
                & p,
                & li {
                  ${C};
                  color: #b4b4b4;
                  font-size: 0.8125rem;
                  font-weight: 400;
                  line-height: 1rem;
                  text-wrap: pretty;
                }
                & a {
                  color: #fde047;
                  font-weight: 500;
                  outline: none;
                  text-decoration: underline;
                  &:focus-visible {
                    outline: 2px solid #6c47ff;
                    outline-offset: 2px;
                  }
                }
              `,children:y.description}),z]})})})]})}function Oe(e){return a(Q,{children:a(ke,{...e})})}export{Oe as KeylessPrompt,ye as getCurrentState,we as getResolvedContent};
