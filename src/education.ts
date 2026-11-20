import type {State} from './state';
export type Subject='math'|'english'|'literature'|'history'|'geography';
export type Education={attended:number[];lessonDay:number;step:number;active:boolean;escorted:boolean;deferredDay:number;safety:{status:'idle'|'report'|'abducted';lastDay:number;learned:boolean;rescues:number};subjects:Record<Subject,number>};
export const freshEducation=():Education=>({attended:[],lessonDay:0,step:0,active:false,escorted:false,deferredDay:0,safety:{status:'idle',lastDay:0,learned:false,rescues:0},subjects:{math:0,english:0,literature:0,history:0,geography:0}});
export const SUBJECTS:Subject[]=['math','english','literature','history','geography'];
export const SUBJECT_NAMES:Record<Subject,string>={math:'Toán',english:'Tiếng Anh',literature:'Văn',history:'Lịch sử',geography:'Địa lý'};
/** Five subjects keep the school morning at 08:00–11:30. */
export const SUBJECT_MINUTES=42;
export const SCHOOL_DURATION=SUBJECTS.length*SUBJECT_MINUTES;
export function schoolStartReason(s:State):string|null {
  const e=s.education;
  if(!s.inside||s.room!=='classroom')return 'Vào lớp và đến góc học tập để bắt đầu.';
  if(s.day%7===0)return 'Hôm nay là ngày nghỉ.';
  if(e.attended.includes(s.day))return 'Hôm nay đã học xong rồi.';
  if(e.safety.status==='abducted')return 'Cần nhờ người lớn trợ giúp trước.';
  if(e.deferredDay===s.day)return 'Đã xin học bù vào ngày mai.';
  if(s.minutes<480)return 'Cô đón lớp lúc 08:00.';
  const remaining=SUBJECTS.length-(e.lessonDay===s.day?e.step:0);
  if(s.minutes+remaining*SUBJECT_MINUTES>=1260)return 'Không còn đủ giờ trước 21:00. Gặp mẹ hoặc cô Mai để xin học bù ngày mai.';
  if(s.energy<10)return 'Cần ít nhất 10 năng lượng. Về nhà ăn nhẹ và nghỉ miễn phí.';
  return null;
}
export type Lesson={subject:Subject;topic:string;visual?:string;question:string;options:string[];answer:number;explanation:string;minAge?:number};
const L=(subject:Subject,topic:string,visual:string,question:string,options:string[],answer:number,explanation:string):Lesson=>({subject,topic,visual,question,options,answer,explanation});
export const lessonBank:Record<Subject,Lesson[]>={
 math:[
  L('math','Đếm số lượng','🍎 🍎 🍎','Trên bàn có bao nhiêu quả táo?',['2 quả','3 quả','4 quả'],1,'Mình đếm chậm: một, hai, ba. Có ba quả táo.'),
  L('math','Phép cộng nhỏ','🐟🐟 + 🐟','Hai con cá thêm một con cá là mấy con?',['3 con','2 con','4 con'],0,'2 thêm 1 là 3.'),
  L('math','Bớt đi','🍬🍬🍬🍬 − 🍬','Có 4 cái kẹo, ăn 1 cái. Còn lại mấy cái?',['5 cái','4 cái','3 cái'],2,'4 bớt 1 còn 3.'),
  L('math','Tính tiền','5.000đ + 2.000đ','Bánh gạo 5.000đ, kẹo 2.000đ. Mua cả hai hết bao nhiêu?',['7.000đ','3.000đ','10.000đ'],0,'5 nghìn cộng 2 nghìn là 7 nghìn đồng.'),
  L('math','So sánh','🔵🔵🔵🔵  ·  🔴🔴','Bên nào nhiều hơn?',['Bên đỏ','Bằng nhau','Bên xanh'],2,'Bên xanh có 4, bên đỏ có 2. 4 nhiều hơn 2.'),
  L('math','Hình học','⬛ ⚪ 🔺','Hình nào có ba cạnh?',['Hình vuông','Hình tam giác','Hình tròn'],1,'Hình tam giác có ba cạnh và ba góc.'),
 ],
 english:[
  L('english','Colors · Màu sắc','🔴','“Red” là màu gì?',['Màu xanh','Màu đỏ','Màu vàng'],1,'Red = màu đỏ. Blue = xanh dương, Yellow = vàng.'),
  L('english','Animals · Con vật','🐶','Con vật này tiếng Anh là gì?',['Cat','Fish','Dog'],2,'Dog = con chó. Cat = con mèo, Fish = con cá.'),
  L('english','Greetings · Chào hỏi','👋 ☀️','Buổi sáng gặp cô giáo, con chào thế nào?',['Good morning!','Good night!','Goodbye!'],0,'Good morning = chào buổi sáng. Good night dùng khi đi ngủ.'),
  L('english','Numbers · Số đếm','✋','“Five” là số mấy?',['3','5','10'],1,'One, two, three, four, five: five là số 5.'),
  L('english','Family · Gia đình','👩','“Mother” nghĩa là gì?',['Bố','Mẹ','Bạn'],1,'Mother (mom) = mẹ. Father (dad) = bố.'),
  L('english','Food · Đồ ăn','🥛','“Milk” là gì?',['Sữa','Bánh mì','Nước'],0,'Milk = sữa. Bread = bánh mì, Water = nước.'),
 ],
 literature:[
  L('literature','Đọc hiểu: Xin phép trước','📖','“Bạn rủ Bông rời sân chơi. Bông nói: Tớ phải hỏi mẹ đã.” Bông làm vậy vì sao?',['Vì Bông không thích bạn','Vì cần hỏi người chăm sóc trước khi đi','Vì Bông mệt'],1,'Trước khi đi đâu cùng ai, mình hỏi bố mẹ hoặc người đang chăm sóc.'),
  L('literature','Ghép vần','b + a','Chữ “b” ghép với “a” đọc là gì?',['ba','bo','bi'],0,'b – a – ba. Ba là bố đó!'),
  L('literature','Đọc hiểu: Tiền thừa','📖','“Mẹ đưa Tí tiền mua sữa. Tí mang tiền thừa về đưa mẹ.” Tí là bạn nhỏ thế nào?',['Hay quên','Thật thà, cẩn thận','Tiêu hoang'],1,'Tiền được giao mua đồ cần mang về cho mẹ. Tí thật thà và cẩn thận.'),
  L('literature','Điền từ còn thiếu','🌙','“Ông trăng tròn ……” Từ nào hợp nhất?',['sáng tỏ','chạy nhanh','ăn cơm'],0,'“Ông trăng tròn sáng tỏ” là câu đồng dao quen thuộc.'),
  L('literature','Đọc hiểu: Nhờ giúp đỡ','📖','“Cún bị lạc ở chợ. Cún đứng yên và nhờ cô bán hàng gọi mẹ.” Cún làm đúng không?',['Đúng, nhờ người lớn tin cậy','Sai, phải chạy đi tìm','Sai, phải khóc thật to'],0,'Khi bị lạc, đứng yên ở nơi đông người và nhờ người lớn tin cậy giúp.'),
  L('literature','Từ trái nghĩa','☀️ ↔ 🌙','Từ trái nghĩa với “ngày” là gì?',['Sáng','Đêm','Trưa'],1,'Ngày và đêm là hai từ trái nghĩa.'),
 ],
 history:[
  L('history','Nhớ nguồn cội','🏯','Các Vua Hùng gắn với truyền thống nào?',['Dựng nước','Lái máy bay','Phát minh máy tính'],0,'Các Vua Hùng gắn với truyền thống dựng nước của dân tộc Việt Nam.'),
  L('history','Anh hùng dân tộc','🌊','Ai chỉ huy chiến thắng Bạch Đằng năm 938?',['Trần Hưng Đạo','Ngô Quyền','Quang Trung'],1,'Ngô Quyền chỉ huy chiến thắng Bạch Đằng năm 938.'),
  L('history','Quê hương Bạch Đằng','⛵','Trần Hưng Đạo gắn với chiến thắng Bạch Đằng năm nào?',['938','1945','1288'],2,'Trần Hưng Đạo gắn với chiến thắng Bạch Đằng năm 1288.'),
  L('history','Giữ gìn di tích','🏛️','Khi thăm di tích, con nên làm gì?',['Viết tên lên tường','Giữ gìn và nghe người lớn kể chuyện','Bẻ đồ làm kỷ niệm'],1,'Giữ gìn di tích giúp các thế hệ sau hiểu câu chuyện của cha ông.'),
  L('history','Tìm hiểu ngày xưa','📷','Vật nào giúp con tìm hiểu cuộc sống ông bà ngày trước?',['Ảnh và đồ dùng cũ của gia đình','Một trò chơi đoán ngẫu nhiên','Chỉ dự đoán mà không hỏi'],0,'Ảnh, đồ dùng và lời kể của ông bà là những nguồn để tìm hiểu quá khứ.'),
  L('history','Hai Bà Trưng','🐘','Hai Bà Trưng được nhớ đến vì điều gì?',['Xây tàu vũ trụ','Làm ra điện thoại','Lãnh đạo cuộc khởi nghĩa chống đô hộ'],2,'Hai Bà Trưng lãnh đạo cuộc khởi nghĩa chống ách đô hộ phương Bắc.'),
  L('history','Quốc khánh','🇻🇳','Ngày Quốc khánh Việt Nam là ngày nào?',['2 tháng 9','1 tháng 6','20 tháng 11'],0,'Ngày 2 tháng 9 là ngày Quốc khánh Việt Nam.'),
  L('history','Bác Hồ','📜','Ai đọc Tuyên ngôn Độc lập năm 1945?',['Ngô Quyền','Chủ tịch Hồ Chí Minh','Trần Hưng Đạo'],1,'Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập ngày 2/9/1945.'),
  L('history','Trước và sau','🕰️','Sự việc nào thường diễn ra trước khi con chào đời?',['Ông bà còn nhỏ','Con vào lớp hôm nay','Con ăn sáng mai'],0,'Ông bà đã trải qua tuổi nhỏ trước khi con được sinh ra.'),
  L('history','Biết ơn','🌼','Tìm hiểu lịch sử giúp chúng ta điều gì?',['Quên chuyện cũ','Biết ơn và hiểu công sức người đi trước','Chê bai mọi thứ ngày xưa'],1,'Lịch sử giúp ta hiểu quá khứ và trân trọng công sức người đi trước.'),
 ],
 geography:[
  L('geography','Bản đồ','🧭','Trên bản đồ game, mũi tên chữ BẮC chỉ hướng nào?',['Nam','Bắc','Tây'],1,'BẮC là hướng bắc. Bản đồ game đặt hướng bắc ở phía trên.'),
  L('geography','Quê hương','🏡','Quảng Yên thuộc tỉnh nào?',['Quảng Ninh','Lâm Đồng','Đồng Tháp'],0,'Quảng Yên thuộc tỉnh Quảng Ninh ở miền Bắc Việt Nam.'),
  L('geography','Thủ đô','🏙️','Thủ đô Việt Nam là thành phố nào?',['Huế','Đà Nẵng','Hà Nội'],2,'Hà Nội là thủ đô của Việt Nam.'),
  L('geography','Sông và biển','🌊','Nước biển thường có vị gì?',['Ngọt','Mặn','Không bao giờ có muối'],1,'Nước biển có nhiều muối nên thường có vị mặn.'),
  L('geography','Thời tiết','☔','Trời mưa, vật nào giúp con đỡ bị ướt?',['Áo mưa','Quạt giấy','Kính bơi'],0,'Áo mưa giúp che cơ thể khi đi dưới mưa.'),
  L('geography','Giữ môi trường','🌳','Việc nào giúp khu phố sạch hơn?',['Bỏ rác xuống hồ','Đổ rác ra đường','Bỏ rác đúng nơi quy định'],2,'Bỏ rác đúng chỗ giúp giữ đường phố và nguồn nước sạch.'),
  L('geography','Châu lục','🌏','Việt Nam nằm ở châu lục nào?',['Châu Âu','Châu Á','Châu Phi'],1,'Việt Nam nằm ở châu Á, trong khu vực Đông Nam Á.'),
  L('geography','Phương hướng','🧭','Hướng đối diện với hướng bắc là hướng nào?',['Nam','Đông','Tây'],0,'Bắc và nam là hai hướng đối diện nhau.'),
  L('geography','Ngày và đêm','☀️','Mặt Trời thường mọc ở hướng nào?',['Tây','Bắc','Đông'],2,'Mặt Trời thường mọc về phía đông và lặn về phía tây.'),
  L('geography','Đọc bản đồ','🗺️','Ký hiệu trên bản đồ được giải thích ở đâu?',['Bảng chú giải','Trang điểm số','Trong ví tiền'],0,'Bảng chú giải cho biết ý nghĩa các màu và ký hiệu trên bản đồ.'),
 ],
};
lessonBank.math.push(
  L('math','Dãy số','1 · 2 · 3 · ?','Sau số 3 là số mấy?',['4','5','2'],0,'Dãy số tiếp theo là 1, 2, 3, 4.'),
  L('math','Chia đều','🍎🍎🍎🍎','4 quả táo chia đều cho 2 bạn, mỗi bạn có mấy quả?',['1 quả','2 quả','4 quả'],1,'Mỗi bạn nhận 2 quả: 2 + 2 = 4.'),
  L('math','Nhận biết số','✋✋','Hai bàn tay thường có tổng cộng bao nhiêu ngón?',['5','8','10'],2,'Mỗi bàn tay thường có 5 ngón, hai bàn tay có 10 ngón.'),
  L('math','Đọc giờ','🕗','Đồng hồ chỉ 8 giờ sáng. Một giờ sau là mấy giờ?',['9 giờ','7 giờ','10 giờ'],0,'8 giờ thêm 1 giờ là 9 giờ.'),
  {...L('math','Tiền thừa','20.000 − 15.000','Có 20.000đ, mua đồ hết 15.000đ. Còn bao nhiêu?',['15.000đ','5.000đ','10.000đ'],1,'20 nghìn trừ 15 nghìn còn 5 nghìn.'),minAge:4},
  {...L('math','Tính theo nhóm','3 + 3 + 3','3 hộp, mỗi hộp 3 bút. Có tất cả bao nhiêu bút?',['6 bút','12 bút','9 bút'],2,'3 + 3 + 3 = 9 bút.'),minAge:4},
);
lessonBank.english.push(
  L('english','Thanks · Cảm ơn','🎁','Khi nhận được giúp đỡ, con nói câu nào?',['Thank you!','Good night!','Goodbye!'],0,'Thank you nghĩa là cảm ơn.'),
  L('english','School · Trường học','📚','“Book” có nghĩa là gì?',['Cái ghế','Quyển sách','Cây xanh'],1,'Book nghĩa là quyển sách.'),
  L('english','Nature · Thiên nhiên','🌳','“Tree” là gì?',['Con cá','Mặt Trời','Cây'],2,'Tree nghĩa là cây.'),
  L('english','Friends · Bạn bè','🤝','“Friend” có nghĩa là gì?',['Người bạn','Quyển vở','Cái bàn'],0,'Friend nghĩa là người bạn.'),
  {...L('english','Simple sentence','🐱','“I have a cat” có nghĩa là gì?',['Tôi có con chó','Tôi có con mèo','Tôi thấy con cá'],1,'I have a cat nghĩa là tôi có một con mèo.'),minAge:4},
  {...L('english','Counting','2 + 1','“Two plus one is three” là phép tính nào?',['2 − 1 = 1','1 + 1 = 2','2 + 1 = 3'],2,'Two là 2, one là 1, three là 3.'),minAge:4},
);
lessonBank.literature.push(
  L('literature','Lời chào','👋','Buổi sáng gặp ông bà, con nói gì?',['Cháu chào ông bà ạ!','Đi ra chỗ khác!','Không nói gì cả'],0,'Chào hỏi lễ phép thể hiện sự quan tâm và kính trọng.'),
  L('literature','Tìm từ chỉ đồ vật','📚','Từ nào chỉ một đồ vật?',['Chạy','Quyển vở','Vui'],1,'Quyển vở là đồ vật. Chạy là hoạt động, vui là cảm xúc.'),
  L('literature','Đọc hiểu: Chia sẻ','📖','“Nam cho An mượn bút khi An quên.” Nam đã làm gì?',['Giấu bút','Trêu bạn','Giúp đỡ bạn'],2,'Nam chia sẻ đồ dùng để giúp bạn tiếp tục học.'),
  L('literature','Từ trái nghĩa','⬆️ ↔ ⬇️','Từ trái nghĩa với “cao” là gì?',['Thấp','Dài','Rộng'],0,'Cao và thấp là hai từ có nghĩa trái ngược nhau.'),
  {...L('literature','Dấu câu','Bạn tên là gì','Cuối câu “Bạn tên là gì” nên có dấu nào?',['Dấu chấm','Dấu hỏi','Dấu phẩy'],1,'Câu hỏi thường kết thúc bằng dấu hỏi.'),minAge:4},
  {...L('literature','Sắp xếp câu','em · cây · tưới','Sắp xếp thế nào thành câu có nghĩa?',['Cây tưới em.','Tưới em cây.','Em tưới cây.'],2,'Em tưới cây là một câu nói rõ ai làm gì.'),minAge:4},
);
/** Kept for compatibility: all lessons in one list. */
export const lessons=SUBJECTS.flatMap(s=>lessonBank[s]);
/** Each school day has five subject steps. The question rotates by day. */
export const currentLesson=(day:number,step:number,age=3)=>{const subject=SUBJECTS[Math.max(0,Math.min(SUBJECTS.length-1,step))];const bank=lessonBank[subject].filter(q=>(q.minAge??3)<=age);return bank[(Math.max(1,day)-1)%bank.length]};
export function restoreEducation(raw:unknown):Education{const base=freshEducation();if(!raw||typeof raw!=='object')return base;const v=raw as Education;return {...base,...v,attended:Array.isArray(v.attended)?v.attended.filter(d=>Number.isSafeInteger(d)&&d>0).slice(-60):[],deferredDay:Number.isSafeInteger(v.deferredDay)?v.deferredDay:0,step:Number.isSafeInteger(v.step)?Math.max(0,Math.min(SUBJECTS.length,v.step)):0,subjects:Object.fromEntries(SUBJECTS.map(id=>[id,Math.max(0,Number(v.subjects?.[id])||0)])) as Record<Subject,number>,safety:{...base.safety,...v.safety,status:['idle','report','abducted'].includes(v.safety?.status)?v.safety.status:'idle'}}}
