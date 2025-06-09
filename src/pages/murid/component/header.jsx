export default function Header() {
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center fixed left-64 right-0 top-0 z-10">
      <h1 className="text-lg font-bold">Admin Panel</h1>
      <div className="flex items-center gap-2">
        <span>Hi Manusia Pusing</span>
        <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center">MP</div>
      </div>
    </header>
  );
}