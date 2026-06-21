export function generateApplicationNo(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `APP-${year}${month}${day}-${random}`;
}

export function generateContractContent(application: {
  applicationNo: string;
  customer: { name: string; company?: string };
  sample: { name: string; model: string; value: number | string };
  targetCountry: string;
  expectedReturnDate: Date;
}): string {
  return `
样机借用合同

合同编号：${application.applicationNo}
签订日期：${new Date().toLocaleDateString('zh-CN')}

甲方（出借方）：
本公司（以下简称"甲方"）

乙方（借用方）：
${application.customer.name}${application.customer.company ? `（${application.customer.company}）` : ''}

一、借用物品
乙方因测试需要，向甲方借用以下设备：
设备名称：${application.sample.name}
型号规格：${application.sample.model}
设备价值：人民币 ${application.sample.value} 元

二、借用用途
乙方承诺该设备仅用于 ${application.targetCountry} 地区的测试用途，不得转借、出租或用于其他商业目的。

三、借用期限
自设备交付之日起，至 ${application.expectedReturnDate.toLocaleDateString('zh-CN')} 止。乙方应按期归还设备。

四、押金条款
乙方需支付押金人民币 ${application.sample.value} 元，设备完好归还且无损坏后，押金全额退还。

五、双方责任
1. 甲方保证设备在出借时处于良好可用状态
2. 乙方应妥善保管设备，如发生损坏或遗失，需按设备价值赔偿
3. 乙方不得擅自拆卸、改装设备
4. 乙方应遵守 ${application.targetCountry} 当地法律法规，不得用于非法用途

六、违约责任
任何一方违反本合同条款，应承担相应的法律责任和经济损失。

七、争议解决
本合同履行过程中如发生争议，双方应友好协商解决；协商不成的，可向甲方所在地人民法院提起诉讼。

（以下为双方签署栏）
甲方（盖章）：                    乙方（盖章）：
代表人签字：                    代表人签字：
日期：                           日期：
  `.trim();
}
