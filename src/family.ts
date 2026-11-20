export type LedgerKind='income'|'expense'|'transfer'|'unpaid';
export type Entry={id:number;day:number;label:string;amount:number;kind:LedgerKind;balance:number};
export type Family={cash:number;savings:number;rest:number;billsDue:number;lastSettledDay:number;ledger:Entry[];nextId:number;daily:{day:number;momHelp:boolean;dadHelp:boolean;overtime:boolean;allowance:boolean;repair:boolean;toy:boolean};jars:{save:number;share:number};advance:number;advanceSpent:number};
export const DAILY_COSTS=[{label:'Bữa ăn gia đình',amount:100000},{label:'Điện, nước và đi lại',amount:30000},{label:'Học tập và chăm sóc bé',amount:40000},{label:'Sinh hoạt khác',amount:80000}];
export const freshFamily=(day=1):Family=>({cash:500000,savings:100000,rest:85,billsDue:0,lastSettledDay:day-1,ledger:[],nextId:1,daily:{day,momHelp:false,dadHelp:false,overtime:false,allowance:false,repair:false,toy:false},jars:{save:0,share:0},advance:0,advanceSpent:0});
export function familyDay(f:Family,day:number){if(f.daily.day!==day)f.daily={day,momHelp:false,dadHelp:false,overtime:false,allowance:false,repair:false,toy:false};return f.daily}
export function record(f:Family,day:number,label:string,amount:number,kind:LedgerKind){f.cash+=amount;f.ledger.unshift({id:f.nextId++,day,label,amount,kind,balance:f.cash});f.ledger=f.ledger.slice(0,100)}
export function forecast(f:Family,day:number){const d=f.daily.day===day?f.daily:{momHelp:false,dadHelp:false,overtime:false};const off=day%7===0;
 const dad={revenue:off?0:300000+(d.overtime?80000:0),cost:off?0:100000-(d.dadHelp?10000:0)+(d.overtime?20000:0)};
 const mom={revenue:off?0:(day%4===2?140000:180000)+(d.momHelp?20000:0),cost:off?0:(day%4===2?50000:60000)};
 const expenses=DAILY_COSTS.reduce((sum,c)=>sum+c.amount,0);return {dad,mom,expenses,net:dad.revenue+mom.revenue-dad.cost-mom.cost-expenses,off};
}
function pay(f:Family,day:number,label:string,amount:number){
 if(f.cash<amount&&f.savings>0){const n=Math.min(amount-f.cash,f.savings);f.savings-=n;record(f,day,'Dùng quỹ dự phòng cho khoản cần thiết',n,'transfer')}
 const paid=Math.min(f.cash,amount);if(paid)record(f,day,label,-paid,'expense');
 if(paid<amount){f.billsDue+=amount-paid;record(f,day,label+' · còn chờ thanh toán '+(amount-paid)+'đ',0,'unpaid')}
}
export function settleFamilyDay(f:Family,day:number){if(day<=f.lastSettledDay)return false;
 for(let date=f.lastSettledDay+1;date<=day;date++){const p=forecast(f,date);
  if(p.dad.revenue)record(f,date,'Bố nhận tiền đơn mộc',p.dad.revenue,'income');if(p.mom.revenue)record(f,date,'Mẹ nhận tiền đơn may',p.mom.revenue,'income');
  if(f.billsDue){const n=Math.min(f.cash,f.billsDue);if(n){f.billsDue-=n;record(f,date,'Thanh toán chi phí còn chờ từ trước',-n,'expense')}}
  if(p.dad.cost)pay(f,date,'Gỗ và vật liệu cho đơn của bố',p.dad.cost);if(p.mom.cost)pay(f,date,'Vải và chỉ cho đơn của mẹ',p.mom.cost);
  for(const c of DAILY_COSTS)pay(f,date,c.label,c.amount);f.rest=Math.max(0,Math.min(100,f.rest+(p.off?12:f.daily.day===date&&f.daily.overtime?-10:2)));f.lastSettledDay=date;
 }return true;
}
export function transferSavings(f:Family,day:number,amount:number,toSavings:boolean){if(!Number.isSafeInteger(amount)||amount<=0)return false;if(toSavings){if(f.cash<amount)return false;f.savings+=amount;record(f,day,'Chuyển vào quỹ dự phòng',-amount,'transfer')}else{if(f.savings<amount)return false;f.savings-=amount;record(f,day,'Rút quỹ dự phòng',amount,'transfer')}return true}
export function restoreFamily(value:unknown,day:number):Family{const base=freshFamily(day);if(!value||typeof value!=='object')return base;const v=value as Family;if(![v.cash,v.savings,v.billsDue,v.advance,v.advanceSpent].every(n=>Number.isSafeInteger(n)&&n>=0)||v.advanceSpent>v.advance)return base;return {...base,...v,daily:{...base.daily,...v.daily},jars:{save:Math.max(0,Number(v.jars?.save)||0),share:Math.max(0,Number(v.jars?.share)||0)},ledger:Array.isArray(v.ledger)?v.ledger.filter(e=>Number.isFinite(e.amount)&&typeof e.label==='string').slice(0,100):[]}}
