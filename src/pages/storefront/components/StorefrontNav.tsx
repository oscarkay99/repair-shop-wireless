import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StorefrontNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/store')}>
          <img
            src="https://public.readdy.ai/ai/img_res/7bf43506-9df4-4671-b4ee-9c6d6fc6f9c0.png"
            alt="FixHub"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className={`font-bold text-sm tracking-tight ${scrolled ? 'text-slate-800' : 'text-white'}`}>FixHub</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {['Phones', 'Laptops', 'Accessories', 'Repairs', 'Warranty'].map((item) => (
            <a
              key={item}
              href="#"
              className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://wa.me/233000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#20b858] transition-all whitespace-nowrap"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-whatsapp-line text-sm" />
            </div>
            Chat with Us
          </a>
          <button
            onClick={() => navigate('/')}
            className={`text-sm font-medium px-4 py-2 rounded-full border transition-all whitespace-nowrap cursor-pointer ${scrolled ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-white/30 text-white hover:bg-white/10'}`}
          >
            Staff Login
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className={`md:hidden w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer ${scrolled ? 'text-slate-700' : 'text-white'}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <i className={`${menuOpen ? 'ri-close-line' : 'ri-menu-line'} text-xl`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
          {['Phones', 'Laptops', 'Accessories', 'Repairs', 'Warranty'].map((item) => (
            <a key={item} href="#" className="block text-sm text-slate-700 py-1.5">{item}</a>
          ))}
          <a
            href="https://wa.me/233000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-medium px-4 py-2.5 rounded-full mt-2 whitespace-nowrap"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-whatsapp-line text-sm" />
            </div>
            Chat on WhatsApp
          </a>
        </div>
      )}
    </nav>
  );
}
