'use client';

import { useEffect, useState } from 'react';
import { useSchemesStore } from '@/store/schemesStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Building, 
  Target, 
  Gift, 
  FileText, 
  Link as LinkIcon,
  Filter,
  Users,
  MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SchemesPage() {
  const { schemes, loading, error, fetchSchemes } = useSchemesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSchemes, setFilteredSchemes] = useState(schemes);
  const { t } = useTranslation();

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = schemes.filter(scheme => 
        scheme.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.Type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme["State/Scope"].toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.Objective.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.Description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSchemes(filtered);
    } else {
      setFilteredSchemes(schemes);
    }
  }, [searchTerm, schemes]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center py-16 sm:py-24 px-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">Government Schemes</h1>
          <p className="text-muted-foreground text-lg">Loading schemes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center py-16 sm:py-24 px-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">Government Schemes</h1>
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Government Schemes
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto mb-8 sm:mb-10">
          Browse available government schemes for maternal and child welfare
        </p>
        
        {/* Search Bar */}
        <div className="max-w-xl sm:max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search schemes by name, type, or description..."
              className="pl-12 pr-4 py-5 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      {searchTerm && (
        <div className="mb-6 sm:mb-8 text-center">
          <p className="text-muted-foreground">
            Found {filteredSchemes.length} scheme{filteredSchemes.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </p>
        </div>
      )}

      {/* Schemes Grid */}
      {filteredSchemes.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div className="bg-gray-100 rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold mb-2">No schemes found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'No schemes available at the moment'}
          </p>
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm('')} className="rounded-xl px-6 py-2">
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:gap-8 md:gap-10 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchemes.map((scheme) => (
            <Card key={scheme._id} className="flex flex-col hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden h-full">
              <CardHeader className="pb-3 sm:pb-4 px-5 sm:px-6">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 pr-2">{scheme.Name}</CardTitle>
                  <Badge variant="secondary" className="text-xs sm:text-sm px-2 py-1">
                    {scheme.Type}
                  </Badge>
                </div>
                <CardDescription className="mt-2">
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {scheme["State/Scope"]}
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pt-0 pb-5 sm:pb-6 px-5 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-900">Objective</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{scheme.Objective}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-900">Eligibility</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{scheme["Eligibility / Target Group"]}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-900">Benefits</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{scheme.Benefits}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-900">Description</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{scheme.Description}</p>
                    </div>
                  </div>
                  
                  {scheme["Official Link"] && (
                    <div className="flex items-start pt-2 sm:pt-3">
                      <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-xs sm:text-sm text-gray-900">Official Link</h3>
                        <a 
                          href={scheme["Official Link"].startsWith('http') ? scheme["Official Link"] : `https://${scheme["Official Link"]}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 mt-1 break-words leading-relaxed underline"
                        >
                          {scheme["Official Link"]}
                        </a>
                      </div>
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