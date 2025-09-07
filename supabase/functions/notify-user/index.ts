import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalNotificationRequest {
  userEmail: string;
  userName: string;
  approved: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, approved }: ApprovalNotificationRequest = await req.json();

    const subject = approved ? "Welcome to VCrm - Account Approved!" : "VCrm Account - Approval Denied";
    
    const htmlContent = approved ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to VCrm!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Account Approved ✅</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hi ${userName},
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news! Your VCrm account has been approved by our admin. You can now log in and start managing your professional contacts.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')}/auth" 
               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Log In to VCrm
            </a>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            If you have any questions or need assistance, please don't hesitate to reach out to our support team.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
          <p>Welcome to the VCrm community!</p>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">VCrm Registration</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Application Not Approved</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hi ${userName},
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for your interest in VCrm. Unfortunately, your account application was not approved at this time.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            If you believe this was an error or would like more information, please contact our admin team.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
          <p>Thank you for your understanding</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "VCrm <onboarding@resend.dev>",
      to: [userEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("User notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "User notification sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-user function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);