import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="font-serif text-base font-bold text-foreground">
            Hills Educational Consult
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Hills Examination Board — supporting Ghanaian JHS schools with quality mock
            examinations and BECE prediction resources.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Quick links</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/membership" className="hover:text-foreground">
                JHS Membership
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-foreground">
                Register your school
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-foreground">
                School login
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Ghana</li>
            <li>info@hillsexamboard.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Hills Educational Consult. All rights reserved.
      </div>
    </footer>
  );
}
