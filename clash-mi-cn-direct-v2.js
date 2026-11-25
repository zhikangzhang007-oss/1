// Clash Mi CN Direct V3.0 | 2026-11-25
// Keep original groups, nodes, DNS and TUN. Existing shared policy is reused only when recognized.
// Public rule sets refresh every 24 hours while Mihomo is running and can reach the source.
function main(config) {
  if (!config || !Array.isArray(config.rules)) return config;
  var groups = Array.isArray(config['proxy-groups']) ? config['proxy-groups'] : [];
  var nodes = Array.isArray(config.proxies) ? config.proxies : [];
  var byName = Object.create(null), nodeNames = Object.create(null), i;
  groups.forEach(function(g){if(g && typeof g.name==='string') byName[g.name]=g;});
  nodes.forEach(function(n){if(n && n.name && n.type!=='direct' && n.type!=='reject') nodeNames[n.name]=true;});
  function usable(name, seen) {
    if (!name || /^(DIRECT|REJECT(?:-DROP)?|PASS|COMPATIBLE|GLOBAL)$/i.test(name)) return false;
    if(nodeNames[name]) return true;
    var g=byName[name];
    if(!g || seen.indexOf(name)>=0) return false;
    if(!/^(select|url-test|fallback|load-balance|relay)$/i.test(g.type||'')) return false;
    if((Array.isArray(g.use) && g.use.length) || g['include-all'] || g['include-all-proxies'] || g['include-all-providers']) return true;
    return (g.proxies||[]).some(function(p){return usable(p,seen.concat([name]));});
  }
  var prefix='personal-cn-v3-';
  var oldPrefix='personal-cn-v2-';
  var prior = config.rules.filter(function(r){return typeof r!=='string' || (r.indexOf('RULE-SET,'+prefix)!==0 && r.indexOf('RULE-SET,'+oldPrefix)!==0);});
  var finalIndex=prior.findIndex(function(r){return typeof r==='string' && /^\s*(MATCH|FINAL)\s*,/i.test(r);});
  var matchTarget=finalIndex>=0 ? prior[finalIndex].split(',')[1].trim() : '';
  // Prefer a recognizable shared manual selection group, then a usable existing catch-all.
  var manual=groups.filter(function(g){return g && g.type==='select' && usable(g.name,[]) && /节点选择|手动选择|代理选择|默认代理|主代理|节点切换|^(?:[^a-zA-Z0-9\u4e00-\u9fa5]*)(?:PROXY|Proxy|代理|节点|Select|节点选择|手动选择|代理选择)(?:[^a-zA-Z0-9\u4e00-\u9fa5]*)$/i.test(g.name);});
  var target=manual.length===1 ? manual[0].name : (usable(matchTarget,[]) && byName[matchTarget] ? matchTarget : '');
  // If ambiguous, leave overseas policies alone; never invent a group.
  var providers=config['rule-providers'] || {};
  Object.keys(providers).forEach(function(k){if(k.indexOf(oldPrefix)===0 || k.indexOf(prefix)===0) delete providers[k];});
  var base='https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/';
  var added=[], tail=[];
  function suffixes(list,policy,out){list.forEach(function(d){out.push('DOMAIN-SUFFIX,'+d+','+policy);});}
  function exact(list,policy,out){list.forEach(function(d){out.push('DOMAIN,'+d+','+policy);});}
  function provider(key,file,format,policy,out){
    var name=prefix+key;
    providers[name]={type:'http',behavior:'domain',format:format,url:base+file+'.'+format,interval:86400,path:'./ruleset/'+name+'.'+format};
    out.push('RULE-SET,'+name+','+policy);
  }
  if(target) {
    suffixes(['openai.com','chatgpt.com','oaistatic.com','oaiusercontent.com','oaistatsig.com','openaimerge.com','openai.org','chatgpt.livekit.cloud','turn.livekit.cloud','host.livekit.cloud','sora.com','chat.com','x.com','twitter.com','twimg.com','t.co','x.ai','grok.com','xai.com','github.com','githubusercontent.com','githubassets.com','github.io'],target,added);
    exact(['cdn.workos.com','forwarder.workos.com','frontend-apps-multi-region.workos.com','images.workoscdn.com','setup.workos.com','workos.imgix.net','challenges.cloudflare.com','openaiapi-site.azureedge.net','openaiassets.blob.core.windows.net','openaicom.imgix.net','o33249.ingest.sentry.io','o207216.ingest.sentry.io'],target,added);
    provider('openai','openai','yaml',target,added);
    provider('twitter','twitter','yaml',target,added);
  }
  suffixes(['qq.com','qpic.cn','qlogo.cn','wechat.com','wechat.com.cn','weixin.com','weixinbridge.com','wx.qq.com','weixin.qq.com','gtimg.cn','gtimg.com','tencent.com','tencentgames.com','tencentgame.com','tim.qq.com','qqmail.com','qishui.com','qishui.cn','qishuimusic.cn','qishui.com.cn','qishuimusic.com.cn','douyin.com','amemv.com','douyincdn.com','douyinpic.com','douyinvod.com','doubao.com','doubaocdn.com','feishu.cn','jianying.com','fanqienovel.com','icbc.com.cn','icbc.cn','ccb.com','ccb.cn','boc.cn','abchina.com','cmbchina.com','bankcomm.com','bankcomm.cn','psbc.com','cib.com.cn','spdb.com.cn','cmbc.com.cn','cebbank.com','pingan.com.cn','bankofbeijing.com.cn','cgbchina.com.cn','hxb.com.cn','citicbank.com','unionpay.com','95516.com','alipay.com','alipayobjects.com','taobao.com','tmall.com','alicdn.com','taobaocdn.com','tbcdn.cn','jd.com','jd.hk','360buy.com','360buyimg.com','jdpay.com','pinduoduo.com','yangkeduo.com','meituan.com','meituan.net','dianping.com','sankuai.com','bilibili.com','xiaohongshu.com','xhscdn.com'],'DIRECT',added);
  exact(['p3-novel.byteimg.com','p6-novel.byteimg.com'],'DIRECT',added);
  provider('bank','category-bank-cn','yaml','DIRECT',added);
  provider('douyin','douyin','yaml','DIRECT',added);
  provider('doubao','doubao','yaml','DIRECT',added);
  provider('feishu','feishu','yaml','DIRECT',added);
  // Tencent service domains, without broad Tencent Cloud IPs or foreign game networks.
  provider('tencent','tencent','mrs','DIRECT',added);
  provider('general','cn','mrs','DIRECT',tail);
  var all=added.concat(tail);
  var rest=prior.filter(function(r){return all.indexOf(r)<0;});
  var end=rest.findIndex(function(r){return typeof r==='string' && /^\s*(MATCH|FINAL)\s*,/i.test(r);});
  if(end<0) end=rest.length;
  rest.splice.apply(rest,[end,0].concat(tail));
  config['rule-providers']=providers;
  config.rules=added.concat(rest);
  return config;
}
