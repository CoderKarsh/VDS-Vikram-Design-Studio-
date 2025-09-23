import logo from '../assets/navbar/LogoIcon.png';
import { FaYoutube, FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-[#F2EFEE]">
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-row lg:flex-row items-center justify-between text-sm gap-4 lg:gap-0">

                {/* Left section: Company logo and brand name, links to homepage */}
                <Link to="/"><div className="flex items-center space-x-3">
                    <img src={logo} alt="Vikram Design Studio Logo" className="h-10 w-auto" />
                    <span className="text-gray-700" style={{ fontFamily: 'Humanist521BT' }}>
                        Vikram Design Studio
                    </span>
                </div>
                </Link>

                {/* Center section: Social media icons for connecting with VDS */}
                <div className="flex space-x-5 text-[#af2b1e] text-lg">
                    <a href="https://www.youtube.com/@vikramdesignstudio4300/featured" target="_blank"><FaYoutube/></a>
                    <a href="https://www.facebook.com/VikramDesignStudioOfficial/" target="_blank"><FaFacebookF/></a>
                    <a href="https://www.instagram.com/vikramdesignstudio/" target="_blank"><FaInstagram/></a>
                    <a href="https://www.linkedin.com/company/74880921/admin/dashboard/" target="_blank"><FaLinkedinIn/></a>
                </div>

                {/* Right section: Copyright notice, visible only on large screens */}
                <div className="text-gray-500 text-xs hidden lg:block">
                    Vikram Design Studio © 2025. All rights reserved.
                </div>

            </div>
        </footer>
    );
};

export default Footer;
