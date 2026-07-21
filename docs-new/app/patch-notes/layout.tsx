import Nav from '@/components/nav';
import Footer from '@/components/footer';

export default function Layout({ children }: LayoutProps<'/patch-notes'>) {
  return (
    <>
      <Nav />
      <div className="min-h-screen pt-16">{children}</div>
      <Footer />
    </>
  );
}
