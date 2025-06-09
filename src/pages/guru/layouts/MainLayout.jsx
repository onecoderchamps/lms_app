import Header from "../component/header";
import Sidebar from "../component/sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
