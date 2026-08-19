import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import Loader from "./loader";
import { Price, ProductWithPrices } from "@/lib/supabase/supabase.types";
import { formatPrice, postData } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import getStripe from "@/lib/stripe/stripeClient";

interface SubscriptionModalProps {
  products: ProductWithPrices[];
}
const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ products }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { open, setOpen } = useSubscriptionModal();
  const { toast } = useToast();
  const { subscription } = useSupabaseUser();
  const user = useSupabaseUser();

  const onClickContinue = async (price: Price) => {
    try {
      setIsLoading(true);
      if (!user) {
        toast({ title: "You must be logged in to upgrade." });
        setIsLoading(false);
        return;
      }
      if (subscription) {
        toast({ title: "Already on a paid plan" });
        setIsLoading(false);
        return;
      }

      const { sessionId } = await postData({
        url: "/api/create-checkout-session",
        data: { price },
      });
      console.log("Getting checkout for stripe");
      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error("Error in onClickContinue", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {subscription?.status === "active" ? (
        <DialogContent>Already on a paid plan!</DialogContent>
      ) : (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to a Pro Plan</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            To access Pro features you need to have a paid plan.
          </DialogDescription>
          {products.length
            ? products.map((product) => (
                <div
                  key={product.name}
                  className="flex
          justify-between
          items-center"
                >
                  {product.prices?.map((price, index) => (
                    <React.Fragment key={index}>
                      <b className="text-3xl text-foreground">
                        {formatPrice(price)} / <small>{price.interval}</small>
                      </b>
                      <Button
                        onClick={() => onClickContinue(price)}
                        disabled={isLoading}
                        className="bg-white/90"
                      >
                        {isLoading ? <Loader /> : "Upgrade  ✨"}
                      </Button>
                    </React.Fragment>
                  ))}
                </div>
              ))
            : ""}
          {/* No Products Available */}
        </DialogContent>
      )}
    </Dialog>
  );
};

export default SubscriptionModal;
