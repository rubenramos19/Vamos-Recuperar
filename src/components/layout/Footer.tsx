import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="flex items-center">
              <div className="relative h-6 w-6 mr-2">
                <div className="absolute inset-0 bg-primary rounded-full opacity-20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 bg-primary rounded-full"></div>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Vamos Recuperar
              </span>
            </Link>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Uma plataforma feita por cidadãos para fortalecer e melhorar as nossas comunidades
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <div className="flex space-x-4 mb-2">
              <Link
                to="/about"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground"
              >
                Sobre
              </Link>
              <Link
                to="/privacy"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground"
              >
                Privacidade
              </Link>
              <Link
                to="/terms"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground"
              >
                Termos
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Vamos Recuperar. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
