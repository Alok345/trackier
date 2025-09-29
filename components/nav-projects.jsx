"use client"

export function NavProjects({ projects }) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="-mb-4">
      {/* <h2 className="px-4 py-2 text-sm font-semibold text-muted-foreground uppercase">
        Projects
      </h2> */}
      <ul>
        {projects.map((item) => (
          <li key={item.name}>
            <a
              href={item.url}
              className="flex items-center px-4 py-2 text-sm font-medium text-sidebar-foreground hover:bg-gray-100 rounded-md"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
