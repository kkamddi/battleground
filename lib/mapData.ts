export type MapCategoryId = "garage" | "vehicle" | "boat" | "glider" | "secret-room" | "gas-station";

export type MapPoint = {
  id: string;
  category: MapCategoryId;
  name: string;
  note: string;
  x: number;
  y: number;
};

export const mapCategories: Array<{
  id: MapCategoryId;
  label: string;
  icon: string;
  color: string;
}> = [
  { id: "garage", label: "차고지", icon: "⌂", color: "#f0b429" },
  { id: "vehicle", label: "고정 차량", icon: "◆", color: "#5bc0eb" },
  { id: "boat", label: "고정 보트", icon: "≈", color: "#4f86f7" },
  { id: "glider", label: "글라이더", icon: "✈", color: "#e76f51" },
  { id: "secret-room", label: "비밀의 방", icon: "●", color: "#a78bfa" },
  { id: "gas-station", label: "주유소", icon: "▮", color: "#65a30d" },
];

const point = (
  category: MapCategoryId,
  id: string,
  name: string,
  x: number,
  y: number,
  note: string,
): MapPoint => ({ category, id, name, note, x, y });

export const erangelPoints: MapPoint[] = [
  point("garage", "garage-georgopol", "게오르고폴 동쪽 차고", 31, 33, "동쪽 도로변 차고지"),
  point("garage", "garage-rozok", "로족 차고", 51, 40, "로족 남쪽 도로 진입부"),
  point("garage", "garage-yasnaya", "야스나야 서쪽 차고", 68, 34, "서쪽 외곽 도로변"),
  point("garage", "garage-pochinki", "포친키 북쪽 차고", 49, 51, "포친키 북쪽 도로변"),
  point("garage", "garage-mylta", "밀타 차고", 72, 59, "밀타 서쪽 진입로"),
  point("garage", "garage-lipovka", "리포브카 차고", 86, 45, "마을 서쪽 도로변"),
  point("garage", "garage-primorsk", "프리모스크 차고", 29, 71, "북동쪽 진입로"),
  point("garage", "garage-novorepnoye", "노보레프노예 차고", 76, 75, "항구 북쪽 도로변"),

  point("vehicle", "vehicle-severny", "세베르니 고정 차량", 50, 18, "남쪽 진입로 주변"),
  point("vehicle", "vehicle-zharki", "자르키 고정 차량", 31, 15, "마을 동쪽 도로변"),
  point("vehicle", "vehicle-georgopol", "게오르고폴 고정 차량", 26, 34, "컨테이너 구역 진입로"),
  point("vehicle", "vehicle-school", "학교 고정 차량", 55, 44, "학교 남쪽 도로변"),
  point("vehicle", "vehicle-gatka", "갓카 고정 차량", 38, 54, "주택 단지 서쪽"),
  point("vehicle", "vehicle-pochinki", "포친키 고정 차량", 50, 55, "남쪽 도로 교차점"),
  point("vehicle", "vehicle-mylta", "밀타 고정 차량", 75, 60, "동쪽 진입로"),
  point("vehicle", "vehicle-ferry", "페리 피어 고정 차량", 43, 67, "선착장 북쪽 도로"),
  point("vehicle", "vehicle-military", "군사 기지 고정 차량", 58, 79, "기지 중앙 도로 주변"),
  point("vehicle", "vehicle-novorepnoye", "노보레프노예 고정 차량", 77, 77, "컨테이너 구역 외곽"),

  point("boat", "boat-zharki", "자르키 보트", 27, 13, "자르키 북서쪽 해안"),
  point("boat", "boat-georgopol", "게오르고폴 보트", 23, 36, "서쪽 항만 수로"),
  point("boat", "boat-lipovka", "리포브카 보트", 91, 46, "리포브카 동쪽 해안"),
  point("boat", "boat-mylta-power", "밀타 파워 보트", 93, 59, "발전소 남쪽 해안"),
  point("boat", "boat-primorsk", "프리모스크 보트", 28, 76, "프리모스크 남쪽 해안"),
  point("boat", "boat-ferry", "페리 피어 보트", 42, 71, "페리 피어 선착장"),
  point("boat", "boat-west-bridge", "서쪽 다리 보트", 47, 72, "서쪽 다리 북단 해안"),
  point("boat", "boat-east-bridge", "동쪽 다리 보트", 69, 69, "동쪽 다리 북단 해안"),
  point("boat", "boat-sosnovka", "소스노브카 보트", 52, 88, "군사 기지 남서쪽 해안"),
  point("boat", "boat-novorepnoye", "노보레프노예 보트", 80, 78, "노보레프노예 항구"),

  point("glider", "glider-zharki", "자르키 글라이더", 35, 13, "자르키 동쪽 외곽 도로"),
  point("glider", "glider-northwest", "북서 해안 글라이더", 21, 24, "북서쪽 해안 도로"),
  point("glider", "glider-severny", "세베르니 글라이더", 48, 12, "세베르니 북쪽 도로"),
  point("glider", "glider-stalber", "스탈베르 글라이더", 70, 14, "스탈베르 북쪽 외곽"),
  point("glider", "glider-kameshki", "카메시키 글라이더", 88, 20, "카메시키 동쪽 도로"),
  point("glider", "glider-georgopol", "게오르고폴 글라이더", 20, 38, "게오르고폴 서쪽 해안 도로"),
  point("glider", "glider-lipovka", "리포브카 글라이더", 92, 43, "리포브카 동쪽 외곽"),
  point("glider", "glider-mylta-power", "밀타 파워 글라이더", 94, 61, "발전소 남동쪽 외곽"),
  point("glider", "glider-primorsk", "프리모스크 글라이더", 24, 72, "프리모스크 서쪽 도로"),
  point("glider", "glider-ferry", "페리 피어 글라이더", 38, 69, "페리 피어 서쪽 들판"),
  point("glider", "glider-sosnovka-west", "소스노브카 서쪽 글라이더", 42, 80, "군사 기지 서쪽 해안"),
  point("glider", "glider-sosnovka-south", "소스노브카 남쪽 글라이더", 57, 91, "군사 기지 남쪽 해안 도로"),
  point("glider", "glider-novorepnoye", "노보레프노예 글라이더", 83, 77, "항구 동쪽 외곽"),

  point("secret-room", "secret-room-northwest", "북서 농가 비밀의 방", 29, 24, "자르키와 게오르고폴 사이 농가"),
  point("secret-room", "secret-room-severny", "세베르니 비밀의 방", 52, 21, "세베르니 남동쪽 외곽"),
  point("secret-room", "secret-room-stalber", "스탈베르 비밀의 방", 70, 23, "스탈베르 남쪽 산지"),
  point("secret-room", "secret-room-kameshki", "카메시키 비밀의 방", 84, 26, "카메시키 남서쪽 농가"),
  point("secret-room", "secret-room-georgopol", "게오르고폴 비밀의 방", 34, 38, "게오르고폴 동쪽 외곽"),
  point("secret-room", "secret-room-ruins", "루인스 비밀의 방", 44, 45, "루인스 북서쪽 능선"),
  point("secret-room", "secret-room-yasnaya", "야스나야 비밀의 방", 73, 39, "야스나야 남쪽 농가"),
  point("secret-room", "secret-room-gatka", "갓카 비밀의 방", 35, 55, "갓카 남서쪽 농가"),
  point("secret-room", "secret-room-pochinki", "포친키 비밀의 방", 54, 58, "포친키 남동쪽 농가"),
  point("secret-room", "secret-room-mylta", "밀타 비밀의 방", 77, 56, "밀타 북동쪽 농가"),
  point("secret-room", "secret-room-quarry", "쿼리 비밀의 방", 36, 65, "쿼리 북쪽 능선"),
  point("secret-room", "secret-room-ferry", "페리 피어 비밀의 방", 48, 65, "페리 피어 북동쪽 농가"),
  point("secret-room", "secret-room-farm", "팜 비밀의 방", 69, 60, "팜 남쪽 농가"),
  point("secret-room", "secret-room-military-west", "군사 기지 서쪽 비밀의 방", 49, 79, "군사 기지 서쪽 외곽"),
  point("secret-room", "secret-room-military-east", "군사 기지 동쪽 비밀의 방", 69, 81, "군사 기지 동쪽 외곽"),
];

