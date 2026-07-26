export default function SiteFooter() {
  return (
    <footer>
      <a className="brand footer-brand" href="/">
        <strong>BGN</strong>
        <span>BATTLEGROUND<br />NEWS</span>
      </a>
      <p>비공식 PUBG 정보 서비스입니다. KRAFTON 또는 PUBG의 공식 서비스가 아닙니다.</p>
      <div>
        <a href="https://pubg.com/ko/news?category=patch_notes" target="_blank" rel="noreferrer">공식 패치노트</a>
        <a href="/weapons">데이터 기준</a>
      </div>
    </footer>
  );
}
