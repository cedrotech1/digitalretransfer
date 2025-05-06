function Footer() {
    const currentYear = new Date().getFullYear();
    
    return (
      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500">
            © {currentYear} Baby Born Recorder. All rights reserved.
          </div>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <a href="#" className="text-sm text-gray-500 hover:text-green-600">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-green-600">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-green-600">
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    );
  }
  
  export default Footer;