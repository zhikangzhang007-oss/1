// Clash Mi V4.1 minimal compatibility test
// Local domain rules only; no new remote providers or proxy groups.
function main(config) {
  if (!config || !Array.isArray(config.rules)) return config;
  var domains = [
    'qishui.com','qishui.cn','qishuimusic.cn','qishuimusic.com.cn',
    'douyin.com','amemv.com','douyincdn.com','douyinpic.com','douyinvod.com',
    'doubao.com','doubaocdn.com',
    'qq.com','qpic.cn','qlogo.cn','gtimg.com','gtimg.cn','wechat.com','wechat.com.cn',
    'alipay.com','alipayobjects.com','unionpay.com','95516.com',
    'icbc.com.cn','ccb.com','abchina.com','boc.cn','cmbchina.com','bankcomm.com','psbc.com','cib.com.cn','spdb.com.cn','cmbc.com.cn','cebbank.com','cgbchina.com.cn','hxb.com.cn','citicbank.com',
    'taobao.com','tmall.com','alicdn.com','jd.com','360buyimg.com','jdpay.com','meituan.com','meituan.net','dianping.com','sankuai.com'
  ];
  var rules = [], i, j;
  for (i=0;i<domains.length;i++) rules.push('DOMAIN-SUFFIX,'+domains[i]+',DIRECT');
  for (j=0;j<config.rules.length;j++) {
    if (rules.indexOf(config.rules[j])===-1) rules.push(config.rules[j]);
  }
  config.rules=rules;
  return config;
}
