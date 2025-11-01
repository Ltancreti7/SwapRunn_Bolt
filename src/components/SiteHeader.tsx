import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import BackButton from "@/components/BackButton";
const SiteHeader = () => {
  const { user, userProfile, signOut } = useAuth();
  useEffect(() => {
    let lastScroll = 0;
    const onScroll = () => {
      const currentScroll = window.scrollY;

      // Scrolling down past threshold - shrink header
      if (currentScroll > lastScroll && currentScroll > 12) {
        document.body.classList.add("scrolled");
      }
      // At the top - expand header
      else if (currentScroll <= 12) {
        document.body.classList.remove("scrolled");
      }
      // Scrolling up but not at top yet - keep header small

      lastScroll = currentScroll;
    };
    window.addEventListener("scroll", onScroll, {
      passive: true,
    });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };
  return (
    <>
      <BackButton />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root{
            --sr-red:#DC2626; --sr-white:#FFFFFF; --sr-bg:#0B0F14;
            --sr-radius:14px; --sr-shadow:0 8px 24px rgba(0,0,0,.25);
            --sr-route-w: clamp(6px, 1.05vw, 8px);
            --sr-max:1120px;
          }
          html,body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
          .sr-h1,.sr-brand,.sr-tagline,.sr-steps h3{font-family:"Inter Tight",Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}

          /* header layout padding with smooth transitions */
          .sr-header .sr-wrap{
            max-width:1120px;
            margin:0 auto;
            padding:12px clamp(16px,4vw,32px);
            display:flex;
            align-items:center;
            justify-content:center;
            gap:24px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          body.scrolled .sr-header .sr-wrap{
            padding:6px clamp(16px,4vw,32px);
          }
          
          .sr-brandstack{
            display:flex;
            flex-direction:column;
            gap:0px;
            align-items:center;
            margin-top:0;
            margin-left:0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          body.scrolled .sr-brandstack{
            margin-top:0;
          }
          
          .sr-brand svg,.sr-brand img{
            height:clamp(120px,14vw,160px);
            width:clamp(180px,13vw,230px);
            vertical-align:-0.06em;
            background:transparent!important;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          body.scrolled .sr-brand svg, body.scrolled .sr-brand img{
            height:clamp(100px,12vw,130px);
            width:clamp(150px,11vw,185px);
          }
          
          .sr-tagline{
            margin:0;
            color:#DC2626;
            font:800 12px/1 "Inter Tight",Inter,system-ui;
            letter-spacing:.18em;
            text-transform:uppercase;
            background:transparent!important;
            border:0!important;
            padding:0!important;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
           .sr-nav{
             margin-right: clamp(-160px, -10vw, -24px);
             transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
           }
           .sr-nav ul{display:flex;gap:18px;margin:0;padding:0;list-style:none}
           .sr-nav li{list-style:none}
           .sr-nav a{
            color:#fff;
            opacity:.92;
            text-decoration:none;
            font-weight:700;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
          }
          .sr-nav a:hover{
            opacity:1;
            transform: translateY(-1px);
          }
          .sr-nav a::after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: -4px;
            left: 50%;
            background-color: #DC2626;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateX(-50%);
          }
          .sr-nav a:hover::after {
            width: 100%;
          }
          
          .sr-nav button{
            color:#fff;
            opacity:.92;
            text-decoration:none;
            font-weight:700;
            background:none;
            border:none;
            cursor:pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
          }
          .sr-nav button:hover{
            opacity:1;
            transform: translateY(-1px);
          }
          .sr-nav button::after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: -4px;
            left: 50%;
            background-color: #DC2626;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateX(-50%);
          }
          .sr-nav button:hover::after {
            width: 100%;
          }
          
          .sr-header{
            position:sticky;
            top:0;
            z-index:50;
            background:rgba(0,0,0,.5);
            backdrop-filter:blur(8px) saturate(120%);
            border-bottom:1px solid rgba(255,255,255,.06);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateY(0);
          }
          body.scrolled .sr-header{
            background:rgba(0,0,0,.7);
            backdrop-filter:blur(12px) saturate(140%);
            border-bottom:1px solid rgba(255,255,255,.12);
            box-shadow: 0 4px 32px rgba(0, 0, 0, 0.3);
          }

          .sr-brand{
            display:inline-flex;
            align-items:baseline;
            text-decoration:none;
            background:transparent;
            font:800 clamp(38px,5vw,56px)/1 "Inter Tight",Inter,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          body.scrolled .sr-brand{
            font:800 clamp(28px,3.2vw,38px)/1 "Inter Tight",Inter,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
          }
          
          .sr-s,.sr-swap{
            color:var(--sr-white);
            text-shadow:0 .5px 0 rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.55);
          }
          .sr-runn{
            color:var(--sr-red);
            position:relative;
            text-shadow:0 .5px 0 rgba(0,0,0,.25),0 2px 6px rgba(0,0,0,.45);
            padding-bottom:.10em;
          }
          .sr-dot{
            color:var(--sr-white);
            text-shadow:0 .5px 0 rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.55);
          }
          
          /* Remove any previous swap-dot experiments */
          .sr-swapdot,.swap-dot,[data-swapdot]{display:none !important}
          
          /* Tagline under logo - centered and red with smooth transitions */
          .sr-header .sr-tagline{
            background:transparent !important;
            border:0 !important;
            padding:0 !important;
            margin-top:-22px !important;
            letter-spacing:.2em;
            text-transform:uppercase;
            color:#DC2626;
            font:700 clamp(9px,1.1vw,11px)/1 "Inter Tight";
            cursor:default;
            pointer-events:none;
            display:block;
            text-align:center;
            width:fit-content;
            position:relative;
            z-index:1;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          body.scrolled .sr-header .sr-tagline{
            opacity: 0;
            transform: translateY(-10px) scale(0.9);
            pointer-events: none;
          }
          .sr-brand .sr-car-old, .sr-brand [data-old-car]{ display:none !important; }
        `,
        }}
      />

      <header className="sr-header py-0">
        <div className="sr-wrap px-[7px] my-0 bg-black/[0.25]">
          <div className="sr-brandstack py-0 my-0">
            <Logo className="sr-brand" size="auth" />
            <div className="sr-tagline">From Dealership to Driveway</div>
          </div>
          <nav className="sr-nav"></nav>
        </div>
      </header>
    </>
  );
};
export default SiteHeader;
