'use client';

import { useEffect } from 'react';
import { useSchemesStore } from '@/store/schemesStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';

export default function SchemesPage() {
  const { schemes, loading, error, fetchSchemes } = useSchemesStore();

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Government Schemes</h1>
        <p>Loading schemes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Government Schemes</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Government Schemes</h1>
      <p className="text-muted-foreground mb-8">
        Browse available government schemes for maternal and child welfare.
      </p>
      
      {schemes.length === 0 ? (
        <p>No schemes available at the moment.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {schemes.map((scheme) => (
            <Card key={scheme._id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{scheme.Name}</CardTitle>
                <CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">{scheme.Type}</Badge>
                    <Badge variant="outline">{scheme["State/Scope"]}</Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm">Objective</h3>
                    <p className="text-sm text-muted-foreground">{scheme.Objective}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-sm">Eligibility</h3>
                    <p className="text-sm text-muted-foreground">{scheme["Eligibility / Target Group"]}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-sm">Benefits</h3>
                    <p className="text-sm text-muted-foreground">{scheme.Benefits}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-sm">Description</h3>
                    <p className="text-sm text-muted-foreground">{scheme.Description}</p>
                  </div>
                  
                  {scheme["Official Link"] && (
                    <div>
                      <h3 className="font-semibold text-sm">Official Link</h3>
                      <p className="text-sm text-muted-foreground">{scheme["Official Link"]}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}