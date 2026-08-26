export type WeaponComparison = {
  slug: string;
  leftSlug: string;
  rightSlug: string;
  eyebrow: string;
  summary: string;
  leftUse: string;
  rightUse: string;
  verdict: string;
};

export const weaponComparisons: WeaponComparison[] = [
  {
    slug: "m416-vs-aug",
    leftSlug: "m416",
    rightSlug: "aug",
    eyebrow: "5.56mm AR 비교",
    summary: "같은 피해량을 가진 두 범용 AR의 연사 속도와 탄속 차이를 비교합니다.",
    leftUse: "익숙한 5.56mm 범용 세팅과 파츠 조합을 이어가고 싶을 때",
    rightUse: "더 높은 연사 속도와 탄속으로 순수 교전 수치를 우선할 때",
    verdict: "현재 기본 수치만 보면 AUG가 RPM과 탄속에서 앞섭니다. 다만 실제 선택은 확보한 파츠, 반동 숙련도와 교전 거리를 함께 판단해야 합니다.",
  },
  {
    slug: "beryl-m762-vs-ace32",
    leftSlug: "beryl-m762",
    rightSlug: "ace32",
    eyebrow: "7.62mm AR 비교",
    summary: "베릴 M762와 ACE32의 한 발 피해량, 연사 속도와 이론 DPS를 비교합니다.",
    leftUse: "높은 피해량과 연사 속도를 활용해 근·중거리 교전 화력을 우선할 때",
    rightUse: "7.62mm AR을 유지하면서 베릴보다 완만한 수치 구성을 원할 때",
    verdict: "기본 피해량과 RPM을 곱한 이론 DPS는 베릴 M762가 우세합니다. 이 수치는 명중률과 반동을 제외하므로 실전 성과를 그대로 의미하지는 않습니다.",
  },
  {
    slug: "mini14-vs-mk12",
    leftSlug: "mini14",
    rightSlug: "mk12",
    eyebrow: "5.56mm DMR 비교",
    summary: "탄속이 빠른 Mini14와 한 발 피해량이 높은 Mk12를 비교합니다.",
    leftUse: "빠른 탄속으로 이동 표적 리드를 줄이고 장거리 명중 편의성을 우선할 때",
    rightUse: "동일 RPM 구간에서 한 발당 피해량을 조금 더 확보하고 싶을 때",
    verdict: "Mini14는 탄속, Mk12는 기본 피해량에서 앞섭니다. 두 총기의 RPM과 탄창 구성은 같아 사격 거리와 탄도 적응도가 선택의 핵심입니다.",
  },
  {
    slug: "slr-vs-dragunov",
    leftSlug: "slr",
    rightSlug: "dragunov",
    eyebrow: "7.62mm DMR 비교",
    summary: "SLR과 Dragunov의 피해량·탄속 차이와 최근 패치 방향을 비교합니다.",
    leftUse: "더 빠른 탄속으로 중·장거리 탄도 계산을 단순하게 가져갈 때",
    rightUse: "탄속보다 한 발 피해량을 우선하고 최근 반동 완화 패치를 활용할 때",
    verdict: "SLR은 탄속이 빠르고 Dragunov는 한 발 피해량이 높습니다. 41.1과 42.1에서 두 총기 모두 조정된 만큼 현재 패치 적응도를 함께 보세요.",
  },
  {
    slug: "mp5k-vs-ump45",
    leftSlug: "mp5k",
    rightSlug: "ump45",
    eyebrow: "SMG 비교",
    summary: "빠른 9mm MP5K와 높은 단발 피해량의 .45 ACP UMP45를 비교합니다.",
    leftUse: "빠른 연사와 높은 이론 DPS로 근거리 순간 화력을 우선할 때",
    rightUse: "연사 속도보다 한 발 피해량과 탄 관리의 여유를 우선할 때",
    verdict: "MP5K는 RPM과 이론 DPS, UMP45는 한 발 피해량이 앞섭니다. 서로 탄약이 달라 스쿼드의 탄 수급 계획도 선택에 영향을 줍니다.",
  },
  {
    slug: "m249-vs-rpd",
    leftSlug: "m249",
    rightSlug: "rpd",
    eyebrow: "LMG 비교 · UPDATE 42.3",
    summary: "42.3 LMG 메타에서 M249와 신규 RPD의 화력과 탄창 구성을 비교합니다.",
    leftUse: "더 높은 RPM과 최대 150발 확장 탄창으로 지속 사격을 우선할 때",
    rightUse: "더 높은 한 발 피해량과 신규 7.62mm LMG 운용을 경험하고 싶을 때",
    verdict: "M249는 RPM과 최대 탄창, RPD는 한 발 피해량이 앞섭니다. 42.3의 LMG 공통 반동·재장전 개선 이후 실제 표본은 계속 갱신될 예정입니다.",
  },
];

export function findWeaponComparison(slug: string) {
  return weaponComparisons.find((comparison) => comparison.slug === slug);
}
