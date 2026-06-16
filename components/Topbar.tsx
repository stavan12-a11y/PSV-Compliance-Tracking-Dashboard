import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

export function Topbar({
  title,
  crumbs,
  actions,
}: {
  title: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="topbar">
      <div>
        {crumbs && crumbs.length > 0 ? (
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <span key={i}>
                {i > 0 ? " / " : ""}
                {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
              </span>
            ))}
          </div>
        ) : null}
        <h1>{title}</h1>
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  );
}
