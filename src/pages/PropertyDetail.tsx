import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Heart, Share2, MapPin, Bed, Bath, Maximize, BadgeCheck,
  TrendingUp, MessageSquare, DollarSign, Eye, Users, Loader2,
} from "lucide-react";
import TerraScore from "@/components/TerraScore";
import InvestmentScore from "@/components/InvestmentScore";
import { calculateValuation } from "@/services/valuationEngine";
import OfferModal from "@/components/OfferModal";
import { useProperty } from "@/hooks/useProperties";
import { useToast } from "@/hooks/use-toast";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import property1 from "@/assets/property-1.jpg";
import { trackPropertyView, trackValuationRequest } from "@/services/dataMoat";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showOffer, setShowOffer] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const toggleFav = useToggleFavorite();

  const { data: property, isLoading } = useProperty(id);

  // Increment view counter
  useEffect(() => {
    if (id) {
      supabase.rpc("increment_property_views", { p_property_id: id });
    }
  }, [id]);

  // Data Moat tracking — fires after property loads
  useEffect(() => {
    if (property) {
      trackPropertyView(property.id, property.city ?? "Unknown", property.price);
      trackValuationRequest(property.id, property.city ?? "Unknown", property.district ?? "Unknown", property.ai_valuation ?? property.price);
    }
  }, [property]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!property) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Property not found.</p>
        <Link to="/buyer/discover" className="text-primary text-sm mt-2 inline-block">Back to marketplace</Link>
      </div>
    );
  }

  const images = property.property_images?.map(i => i.url) ?? [property1];
  const valuationDiff = (property.ai_valuation ?? property.price) - property.price;
  const valuationPercent = Math.round((valuationDiff / property.price) * 100);

  // AI Valuation Engine — Module 1
  const valuation = calculateValuation({
    price: property.price,
    area: property.area ?? 150,
    bedrooms: property.bedrooms ?? 3,
    bathrooms: property.bathrooms ?? 2,
    city: property.city ?? "Erbil",
    district: property.district ?? "Ankawa",
    propertyType: property.property_type ?? "Apartment",
    verified: property.verified ?? false,
    features: property.features ?? [],
  });

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "Property link has been copied to clipboard." });
    } catch { toast({ title: "Share", description: window.location.href }); }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/buyer/discover" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to marketplace
      </Link>

      <div className="rounded-xl overflow-hidden mb-6">
        <div className="relative aspect-[16/9] lg:aspect-[2/1]">
          <img src={images[activeImage]} alt={property.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => { setLiked(!liked); toggleFav.mutate(property.id); toast({ title: liked ? "Removed" : "Added to favorites" }); }}
              className={`p-2.5 rounded-lg backdrop-blur-sm transition-colors ${liked ? "bg-destructive/80 text-destructive-foreground" : "bg-background/40 text-foreground hover:text-primary"}`}>
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            </button>
            <button onClick={handleShare} className="p-2.5 rounded-lg bg-background/40 backdrop-blur-sm text-foreground hover:text-primary transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 mt-2">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImage(i)} className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">{property.title}</h1>
                <p className="flex items-center gap-1 mt-2 text-muted-foreground"><MapPin className="w-4 h-4" /> {property.district}, {property.city}</p>
              </div>
              {property.verified && (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                  <BadgeCheck className="w-4 h-4" /> Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
              {property.bedrooms > 0 && <span className="flex items-center gap-1.5"><Bed className="w-4 h-4" /> {property.bedrooms} Beds</span>}
              <span className="flex items-center gap-1.5"><Bath className="w-4 h-4" /> {property.bathrooms} Baths</span>
              <span className="flex items-center gap-1.5"><Maximize className="w-4 h-4" /> {property.area}m²</span>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border p-5">
            <h3 className="font-semibold text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {property.features?.map((f) => <span key={f} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">{f}</span>)}
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">TerraScore™</h3>
              <TerraScore score={property.terra_score} size="md" />
            </div>
          </div>

          {/* AI Valuation Engine — Module 1 */}
          <div className="rounded-xl bg-card border border-border p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> AI Valuation Analysis
            </h3>
            <div className={`rounded-lg p-3 border ${
              valuation.verdict === "undervalued" ? "bg-success/10 border-success/20" :
              valuation.verdict === "overvalued" ? "bg-destructive/10 border-destructive/20" :
              "bg-warning/10 border-warning/20"
            }`}>
              <p className={`text-sm font-bold ${
                valuation.verdict === "undervalued" ? "text-success" :
                valuation.verdict === "overvalued" ? "text-destructive" : "text-warning"
              }`}>{valuation.verdictLabel}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Confidence: {valuation.confidenceLabel} ({valuation.confidenceScore}/100)</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-[10px] text-muted-foreground">AI Est. Value</p>
                <p className="text-base font-bold text-foreground">${valuation.estimatedValue.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-[10px] text-muted-foreground">Discount vs Market</p>
                <p className={`text-base font-bold ${valuation.discountPercent <= -5 ? "text-success" : valuation.discountPercent >= 5 ? "text-destructive" : "text-warning"}`}>
                  {valuation.discountPercent > 0 ? "+" : ""}{valuation.discountPercent}%
                </p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-[10px] text-muted-foreground">Price / m²</p>
                <p className="text-sm font-bold text-foreground">${valuation.pricePerSqm}/m²</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-[10px] text-muted-foreground">Market $/m²</p>
                <p className="text-sm font-bold text-foreground">${valuation.marketPricePerSqm}/m²</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">5-Year Appreciation Forecast</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "1 Year", val: valuation.appreciation.oneYear },
                  { label: "3 Years", val: valuation.appreciation.threeYear },
                  { label: "5 Years", val: valuation.appreciation.fiveYear },
                ].map(f => (
                  <div key={f.label} className="rounded-lg bg-primary/5 border border-primary/10 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">{f.label}</p>
                    <p className="text-xs font-bold text-primary">${(f.val / 1000).toFixed(0)}K</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Investment Score Engine — Module 2 */}
          <InvestmentScore input={{
            price: property.price,
            aiValuation: property.ai_valuation ?? valuation.estimatedValue,
            rentalYield: 7.5,
            city: property.city ?? "Erbil",
            district: property.district ?? "Ankawa",
            propertyType: property.property_type ?? "Apartment",
            developerRating: property.agent_verified ? 4.2 : 3.5,
            verified: property.verified ?? false,
          }} />

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-card border border-border p-4 text-center">
              <Eye className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">{property.views.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 text-center">
              <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">—</p>
              <p className="text-xs text-muted-foreground">Leads</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">{property.ai_confidence || "—"}</p>
              <p className="text-xs text-muted-foreground">AI Confidence</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-card border border-border p-5 shadow-card sticky top-20">
            <p className="text-3xl font-bold text-foreground">${property.price.toLocaleString()}</p>
            {property.price_iqd && <p className="text-sm text-muted-foreground mt-1">IQD {property.price_iqd.toLocaleString()}</p>}

            {property.ai_valuation && (
              <div className="mt-4 p-3 rounded-lg bg-secondary">
                <p className="text-xs text-muted-foreground">AI Valuation</p>
                <p className="text-lg font-bold text-foreground">${property.ai_valuation.toLocaleString()}</p>
                <p className={`text-xs font-medium ${valuationDiff >= 0 ? "text-success" : "text-destructive"}`}>
                  {valuationDiff >= 0 ? "+" : ""}${valuationDiff.toLocaleString()} ({valuationPercent > 0 ? "+" : ""}{valuationPercent}%)
                </p>
              </div>
            )}

            <div className="mt-5 space-y-3">
              <button onClick={() => setShowOffer(true)} className="w-full py-3 rounded-xl bg-gradient-gold text-primary-foreground font-semibold text-sm shadow-gold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <DollarSign className="w-4 h-4" /> Send Offer (Pro+)
              </button>
              <button onClick={() => navigate("/buyer/messages")} className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> Message Seller
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Listed by</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {(property.agent_name || "?").charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    {property.agent_name || "Unknown"}
                    {property.agent_verified && <BadgeCheck className="w-3 h-3 text-primary" />}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border p-5">
            <h3 className="font-semibold text-foreground mb-2">AI Analysis Results</h3>
            <p className="text-sm text-muted-foreground mb-4">Open full AI investment analysis.</p>
            <button onClick={() => navigate(`/buyer/analysis/${property.id}`)} className="w-full py-3 rounded-xl bg-gradient-gold text-primary-foreground font-semibold text-sm shadow-gold hover:opacity-90 transition-opacity">
              Open AI Analysis Page
            </button>
          </div>
        </div>
      </div>

      {showOffer && <OfferModal property={property} onClose={() => setShowOffer(false)} />}
    </div>
  );
}
