import{u as B}from"./EnvironmentContext-Cjv51nrv.js";import{InternalThemeProvider as M}from"./index-BGk5q3Fi.js";import{F as g,e as r}from"./index-D0M7H08z.js";import{M as j}from"./Modal-C66Kzsct.js";import{P as G}from"./Portal-DX7eah07.js";import{b as d,P as F,a as T,C as L}from"./shared-9ly1ii20.js";import{j as e,e as V,r as c,c as s,F as m,R as D,i as Z}from"./index.html-BoVIvYkW.js";import"./underscore-ClYSgvuy-PzdM3hke.js";import"./AppearanceContext-8gIN1SFH.js";import"./OptionsContext-WG-C8CCL.js";import"./utils-TXJdVJx7-CO7FM5J0.js";import"./makeLocalizable-CqxYGbH4.js";import"./localizationKeys-L95TEc06.js";import"./makeCustomizable-SHScV6v8.js";import"./url-DaPDWryr-vZ2B9-Jn.js";import"./floating-ui.react-3oCNdN8R.js";import"./useScrollLock-DtPRJxpD.js";import"./index-BUzwQIwI.js";import"./RouteContext-DMHMTKIE.js";const Y="https://dashboard.clerk.com/~/organizations-settings",q=({caller:i,onSuccess:a,onClose:o})=>{const t=V(),[p,h]=c.useState(!1),[l,u]=c.useState(!1),[w,P]=c.useState(null),[y,_]=c.useState(!1),z=c.useRef(null),f=B(),v=c.useId(),S=!i.startsWith("use"),C=typeof(f==null?void 0:f.organizationSettings.forceOrganizationSelection)<"u",A=()=>{h(!0);const n={enable_organizations:!0};C&&(n.organization_allow_personal_accounts=y),f.__internal_enableEnvironmentSetting(n).then(async()=>{var k,$,I;P(((I=($=await((k=t.user)==null?void 0:k.getOrganizationMemberships()))==null?void 0:$.data[0])==null?void 0:I.organization.name)??null),u(!0),h(!1)}).catch(()=>{h(!1)})};return e(G,{children:e(j,{canCloseModal:!1,containerSx:()=>({alignItems:"center"}),initialFocusRef:z,children:s(F,{sx:()=>({display:"flex",flexDirection:"column",width:"30rem",maxWidth:"calc(100vw - 2rem)"}),children:[s(g,{direction:"col",sx:n=>({padding:`${n.sizes.$4} ${n.sizes.$6}`,paddingBottom:n.sizes.$4,gap:n.sizes.$2}),children:[s(g,{as:"header",align:"center",sx:n=>({gap:n.sizes.$2}),children:[e(Q,{isEnabled:l}),e("h1",{css:[d,r`
                    color: white;
                    font-size: 0.875rem;
                    font-weight: 500;
                    outline: none;
                  `],tabIndex:-1,ref:z,children:l?"Organizations feature enabled":"Organizations feature required"})]}),e(g,{direction:"col",align:"start",sx:n=>({gap:n.sizes.$0x5}),children:l?s("p",{css:[d,r`
                      color: #b4b4b4;
                      font-size: 0.8125rem;
                      font-weight: 400;
                      line-height: 1.3;
                    `],children:[t.user&&w?`The Organizations feature has been enabled for your application. A default organization named "${w}" was created automatically. You can manage or rename it in your`:"The Organizations feature has been enabled for your application. You can manage it in your"," ",e(O,{href:Y,target:"_blank",rel:"noopener noreferrer",children:"dashboard"}),"."]}):s(m,{children:[s("p",{id:v,css:[d,r`
                        color: #b4b4b4;
                        font-size: 0.8125rem;
                        font-weight: 400;
                        line-height: 1.23;
                      `],children:["Enable Organizations to use"," ",e("code",{css:[d,r`
                          font-size: 0.75rem;
                          color: white;
                          font-family: monospace;
                          line-height: 1.23;
                        `],children:S?`<${i} />`:i})," "]}),e(O,{href:"https://clerk.com/docs/guides/organizations/overview",target:"_blank",rel:"noopener noreferrer",children:"Learn more"})]})}),C&&!l&&e(g,{sx:n=>({marginTop:n.sizes.$2}),direction:"col",children:s(K,{value:y?"optional":"required",onChange:n=>_(n==="optional"),labelledBy:v,children:[e(E,{value:"required",label:s(g,{wrap:"wrap",sx:n=>({columnGap:n.sizes.$2,rowGap:n.sizes.$1}),children:[e("span",{children:"Membership required"}),e(W,{children:"Standard"})]}),description:s(m,{children:[e("span",{className:"block",children:"Users need to belong to at least one organization."}),e("span",{children:"Common for most B2B SaaS applications"})]})}),e(E,{value:"optional",label:"Membership optional",description:"Users can work outside of an organization with a personal account"})]})})]}),e("span",{css:r`
              height: 1px;
              display: block;
              width: calc(100% - 2px);
              margin-inline: auto;
              background-color: #151515;
              box-shadow: 0px 1px 0px 0px #424242;
            `}),e(g,{justify:"center",sx:n=>({padding:`${n.sizes.$4} ${n.sizes.$6}`,gap:n.sizes.$3,justifyContent:"flex-end"}),children:l?e(b,{variant:"solid",onClick:()=>{var n;t.user?a==null||a():(t.redirectToSignIn(),(n=t.__internal_closeEnableOrganizationsPrompt)==null||n.call(t))},children:t.user?"Continue":"Sign in to continue"}):s(m,{children:[e(b,{variant:"outline",onClick:()=>{var n;(n=t==null?void 0:t.__internal_closeEnableOrganizationsPrompt)==null||n.call(t),o==null||o()},children:"I'll remove it myself"}),e(b,{variant:"solid",onClick:A,disabled:p,children:"Enable Organizations"})]})})]})})})},xe=i=>e(M,{children:e(q,{...i})}),N=r`
  ${d};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.75rem;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.12px;
  color: white;
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.32);
  white-space: nowrap;
  user-select: none;
  color: white;
  outline: none;

  &:not(:disabled) {
    transition: 120ms ease-in-out;
    transition-property: background-color, border-color, box-shadow, color;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus-visible:not(:disabled) {
    outline: 2px solid white;
    outline-offset: 2px;
  }
`,U={solid:r`
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30.5%, rgba(0, 0, 0, 0.05) 100%), #454545;
  box-shadow:
    0 0 3px 0 rgba(253, 224, 71, 0) inset,
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 1px 0 0 rgba(255, 255, 255, 0.04) inset,
    0 0 0 1px rgba(0, 0, 0, 0.12),
    0 1.5px 2px 0 rgba(0, 0, 0, 0.48);

  &:hover:not(:disabled) {
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30.5%, rgba(0, 0, 0, 0.15) 100%), #5f5f5f;
    box-shadow:
      0 0 3px 0 rgba(253, 224, 71, 0) inset,
      0 0 0 1px rgba(255, 255, 255, 0.04) inset,
      0 1px 0 0 rgba(255, 255, 255, 0.04) inset,
      0 0 0 1px rgba(0, 0, 0, 0.12),
      0 1.5px 2px 0 rgba(0, 0, 0, 0.48);
  }
`,outline:r`
  border: 1px solid rgba(118, 118, 132, 0.25);
  background: rgba(69, 69, 69, 0.1);

  &:hover:not(:disabled) {
    border-color: rgba(118, 118, 132, 0.5);
  }
`},b=c.forwardRef(({variant:i="solid",...a},o)=>e("button",{ref:o,type:"button",css:[N,U[i]],...a})),W=({children:i})=>e("span",{css:r`
        ${d};
        display: inline-flex;
        align-items: center;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-size: 0.6875rem;
        font-weight: 500;
        line-height: 1.23;
        background-color: #ebebeb;
        color: #2b2b34;
        white-space: nowrap;
      `,children:i}),[H,J]=Z("RadioGroupContext"),K=({value:i,onChange:a,children:o,labelledBy:t})=>{const p=c.useId(),h=D.useMemo(()=>({value:{name:p,value:i,onChange:a}}),[p,i,a]);return e(H.Provider,{value:h,children:e(g,{role:"radiogroup",direction:"col",gap:3,"aria-orientation":"vertical","aria-labelledby":t,children:o})})},x="1rem",R="0.5rem",E=({value:i,label:a,description:o})=>{const{name:t,value:p,onChange:h}=J(),l=c.useId(),u=i===p;return s(g,{direction:"col",gap:1,children:[s("label",{css:r`
          ${d};
          display: flex;
          align-items: flex-start;
          gap: ${R};
          cursor: pointer;
          user-select: none;

          &:has(input:focus-visible) > span:first-of-type {
            outline: 2px solid white;
            outline-offset: 2px;
          }

          &:hover:has(input:not(:checked)) > span:first-of-type {
            background-color: rgba(255, 255, 255, 0.08);
          }

          &:hover:has(input:checked) > span:first-of-type {
            background-color: rgba(108, 71, 255, 0.8);
            background-color: color-mix(in srgb, #6c47ff 80%, transparent);
          }
        `,children:[e("input",{type:"radio",name:t,value:i,checked:u,onChange:()=>h(i),"aria-describedby":o?l:void 0,css:r`
            ${d};
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
          `}),e("span",{"aria-hidden":"true",css:r`
            ${d};
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: ${x};
            height: ${x};
            margin-top: 0.125rem;
            flex-shrink: 0;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background-color: transparent;
            transition: 120ms ease-in-out;
            transition-property: border-color, background-color, box-shadow;

            ${u&&r`
              border-width: 2px;
              border-color: #6c47ff;
              background-color: #6c47ff;
              background-color: color-mix(in srgb, #6c47ff 100%, transparent);
              box-shadow: 0 0 0 2px rgba(108, 71, 255, 0.2);
            `}

            &::after {
              content: '';
              position: absolute;
              width: 0.375rem;
              height: 0.375rem;
              border-radius: 50%;
              background-color: white;
              opacity: ${u?1:0};
              transform: scale(${u?1:0});
              transition: 120ms ease-in-out;
              transition-property: opacity, transform;
            }
          `}),e("span",{css:[d,r`
              font-size: 0.875rem;
              font-weight: 500;
              line-height: 1.25;
              color: white;
            `],children:a})]}),o&&e("span",{id:l,css:[d,r`
              padding-inline-start: calc(${x} + ${R});
              font-size: 0.75rem;
              line-height: 1.33;
              color: #c3c3c6;
              text-wrap: pretty;
            `],children:o})]})},O=c.forwardRef(({children:i,css:a,...o},t)=>e("a",{ref:t,...o,css:[d,r`
            color: #a8a8ff;
            font-size: inherit;
            font-weight: 500;
            line-height: 1.3;
            font-size: 0.8125rem;
            min-width: 0;
          `,a],children:i})),Q=({isEnabled:i})=>{const[a,o]=c.useState(0);c.useLayoutEffect(()=>{if(i){o(u=>u===0?180:0);return}const l=setInterval(()=>{o(u=>u===0?180:0)},2e3);return()=>clearInterval(l)},[i]);let t="idle",p="warning";i&&(a===0?(t="success",p="warning"):(p="success",t="idle"));const h=l=>{switch(l){case"idle":return e(L,{});case"success":return e(T,{css:r`
              width: 1.25rem;
              height: 1.25rem;
            `});case"warning":return s("svg",{css:r`
              width: 1.25rem;
              height: 1.25rem;
            `,viewBox:"0 0 20 20",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[e("path",{opacity:"0.2",d:"M17.25 10C17.25 14.0041 14.0041 17.25 10 17.25C5.99594 17.25 2.75 14.0041 2.75 10C2.75 5.99594 5.99594 2.75 10 2.75C14.0041 2.75 17.25 5.99594 17.25 10Z",fill:"#EAB308"}),e("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M10 3.5C6.41015 3.5 3.5 6.41015 3.5 10C3.5 13.5899 6.41015 16.5 10 16.5C13.5899 16.5 16.5 13.5899 16.5 10C16.5 6.41015 13.5899 3.5 10 3.5ZM2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10Z",fill:"#EAB308"}),e("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M10 6C10.5523 6 11 6.44772 11 7V9C11 9.55228 10.5523 10 10 10C9.44772 10 9 9.55228 9 9V7C9 6.44772 9.44772 6 10 6Z",fill:"#EAB308"}),e("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M10 12C10.5523 12 11 12.4477 11 13V13.01C11 13.5623 10.5523 14.01 10 14.01C9.44772 14.01 9 13.5623 9 13.01V13C9 12.4477 9.44772 12 10 12Z",fill:"#EAB308"})]})}};return e("div",{css:r`
        perspective: 1000px;
        width: 1.25rem;
        height: 1.25rem;
      `,children:s("div",{css:r`
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.6s ease-in-out;
          transform: rotateY(${a}deg);

          @media (prefers-reduced-motion: reduce) {
            transition: none;
          }
        `,children:[e("span",{"aria-hidden":!0,css:r`
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-font-smoothing: antialiased;
            transform: rotateY(0deg);
          `,children:h(t)}),e("span",{"aria-hidden":!0,css:r`
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            transform: rotateY(180deg);
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-font-smoothing: antialiased;
          `,children:h(p)})]})})};export{xe as EnableOrganizationsPrompt};
