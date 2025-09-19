import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface PhoneLoginFormProps {
  onBack: () => void;
}

const PhoneLoginForm = ({ onBack }: PhoneLoginFormProps) => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { signInWithPhone, verifyOtp } = useAuth();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signInWithPhone(phone);
      setOtpSent(true);
    } catch (error) {
      // Error is already handled in the signInWithPhone function
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await verifyOtp(phone, otp);
    } catch (error) {
      // Error is already handled in the verifyOtp function
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Phone Login</CardTitle>
            <CardDescription>
              {otpSent ? "Enter the verification code sent to your phone" : "Enter your phone number"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
        <CardContent className="space-y-4">
          {!otpSent ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (otpSent ? "Verifying..." : "Sending OTP...") 
              : (otpSent ? "Verify Code" : "Send OTP")
            }
          </Button>
        </CardContent>
      </form>
    </Card>
  );
};

export default PhoneLoginForm;