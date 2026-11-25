// Clash Mi CN Direct V2.0 | 2026-11-25
// Add-only override. Rule providers refresh every 86400 seconds.
// Keep the subscription's nodes, proxy groups, DNS, TUN and existing rules.
function main(config) {
  if (!config || !Array.isArray(config.rules)) {
    throw new Error('CN Direct V2 requires a subscription with an existing rules array.');
  }
  var base = 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/';
  var prefix = 'personal-cn-v2-';
  var sets = [
    ['bank','category-bank-cn','yaml'],
    ['douyin','douyin','yaml'],
    ['doubao','doubao','yaml'],
    ['feishu','feishu','yaml'],
    ['general','cn','mrs']
  ];
  var providers = config['rule-providers'] || {};
  var ownRules = [];
  var i;
  for (i = 0; i < sets.length; i++) {
    var s = sets[i];
    var key = prefix + s[0];
    var url = base + s[1] + '.' + s[2];
    if (providers[key] && providers[key].url !== url) {
      throw new Error('Conflicting rule provider: ' + key);
    }
    providers[key] = {
      type: 'http', behavior: 'domain', format: s[2],
      url: url, interval: 86400
    };
    ownRules.push('RULE-SET,' + key + ',DIRECT');
  }
  config['rule-providers'] = providers;
  // Explicit fallbacks for important services, even if provider refresh fails.
  // No broad international ByteDance or foreign banking suffixes.
  var suffixes = [
    'qishui.com','qishui.cn','qishuimusic.cn','qishui.com.cn','qishuimusic.com.cn',
    'douyin.com','amemv.com','douyincdn.com','douyinpic.com','douyinvod.com',
    'doubao.com','doubaocdn.com','feishu.cn','jianying.com','fanqienovel.com',
    'icbc.com.cn','icbc.cn','ccb.com','ccb.cn','boc.cn','abchina.com',
    'cmbchina.com','bankcomm.com','bankcomm.cn','psbc.com','cib.com.cn',
    'spdb.com.cn','cmbc.com.cn','cebbank.com','pingan.com.cn','bankofbeijing.com.cn',
    'cgbchina.com.cn','hxb.com.cn','citicbank.com','unionpay.com','95516.com',
    'alipay.com','alipayobjects.com','wechat.com.cn','weixin.qq.com',
    'taobao.com','tmall.com','jd.com','pinduoduo.com','yangkeduo.com',
    'meituan.com','dianping.com','bilibili.com','xiaohongshu.com','xhscdn.com'
  ];
  var exactHosts = ['p3-novel.byteimg.com','p6-novel.byteimg.com'];
  var extra = suffixes.map(function (d) { return 'DOMAIN-SUFFIX,' + d + ',DIRECT'; });
  extra = extra.concat(exactHosts.map(function (d) { return 'DOMAIN,' + d + ',DIRECT'; }));
  var general = ownRules.pop();
  var priority = extra.concat(ownRules);
  var inserted = priority.concat([general]);
  // Idempotent, remove only exactly matching rules inserted by this script.
  var rest = config.rules.filter(function (r) { return inserted.indexOf(r) < 0; });
  // Preserve explicit subscription policies: general CN is only a fallback
  // immediately before the first unconditional MATCH/FINAL rule.
  var end = rest.length;
  for (i = 0; i < rest.length; i++) {
    if (/^\s*(MATCH|FINAL)\s*,/i.test(rest[i])) { end = i; break; }
  }
  rest.splice(end, 0, general);
  config.rules = priority.concat(rest);
  return config;
}
