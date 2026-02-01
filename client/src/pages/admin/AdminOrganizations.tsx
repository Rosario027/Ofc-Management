import { useState } from "react";
import { useOrganizations, useCreateOrganization } from "@/hooks/use-organizations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

export default function AdminOrganizations() {
  const { data: organizations, isLoading } = useOrganizations();
  const createOrganization = useCreateOrganization();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    address: "",
    phone: "",
    email: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrganization.mutateAsync({
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
      });
      toast({ title: "Organization Created", description: "The organization has been created successfully." });
      setIsCreateOpen(false);
      setFormData({ name: "", slug: "", address: "", phone: "", email: "" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create organization.", variant: "destructive" });
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display">Organizations</h2>
          <p className="text-muted-foreground">Manage your organizations and company details.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input
                  required
                  placeholder="e.g., Acme Corporation"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Slug (URL identifier)</Label>
                <Input
                  required
                  placeholder="acme-corporation"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Used in URLs. Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  placeholder="Company address..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createOrganization.isPending}>
                {createOrganization.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Organization"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations?.map((org) => (
          <Card key={org.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              </div>
              <CardTitle className="mt-4">{org.name}</CardTitle>
              <CardDescription>Created {format(parseISO(org.createdAt), "MMMM d, yyyy")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {org.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{org.address}</span>
                </div>
              )}
              {org.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{org.phone}</span>
                </div>
              )}
              {org.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>{org.email}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {organizations?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No organizations created yet.</p>
            <p className="text-sm text-muted-foreground">Create your first organization to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
