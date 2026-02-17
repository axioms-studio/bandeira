import { Link, usePage, router } from "@inertiajs/react";
import { SharedProps } from "@/types/global";
import PublicLayout from "@/Layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Plus, Users, Trash2 } from "lucide-react";

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Props {
  users: UserItem[];
}

const roleBadge: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  editor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  viewer: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function Index() {
  const { users } = usePage<SharedProps & Props>().props;

  const handleDelete = (userId: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      router.delete(`/users/${userId}`);
    }
  };

  return (
    <PublicLayout activePage="users">
      <div className="mx-auto max-w-7xl px-6 py-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Users
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage user accounts and roles
            </p>
          </div>
          <Button asChild>
            <Link href="/users/create">
              <Plus className="w-4 h-4" />
              Add User
            </Link>
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-2xl mb-5">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                No users yet
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mb-6">
                Get started by creating your first user account.
              </p>
              <Link href="/users/create">
                <Button>
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">
                          {u.name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-medium ${roleBadge[u.role] ?? roleBadge.viewer}`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {u.email} &middot; Joined {u.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/users/${u.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(u.id, u.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
