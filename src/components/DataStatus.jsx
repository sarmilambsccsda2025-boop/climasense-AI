export default function DataStatus({status='UNAVAILABLE'}) {
  const tone = status === 'REAL' ? 'text-[#b9fbc0]' : status === 'ESTIMATED' ? 'text-[#f4d06f]' : 'text-[#ffb09d]';
  return <span className={`text-[10px] uppercase tracking-wider ${tone}`}>{status}</span>;
}
