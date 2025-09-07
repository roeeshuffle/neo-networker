import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyAdminRequest {
  userEmail: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName }: NotifyAdminRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "VCrm <onboarding@resend.dev>",
      to: ["roee2912@gmail.com"], // Using your verified email since guy@wershuffle.com needs domain verification
      subject: "New User Registration - Approval Required (for guy@wershuffle.com)",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">VCrm - New User Registration</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Notification for Admin: guy@wershuffle.com</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 0; color: #856404; font-weight: bold;">📧 Admin Notification</p>
              <p style="margin: 5px 0 0 0; color: #856404;">This email is sent to you (roee2912@gmail.com) because guy@wershuffle.com requires domain verification in Resend. Please forward this to guy@wershuffle.com or verify the domain at resend.com/domains</p>
            </div>
            <h2 style="color: #333; margin-top: 0;">Approval Required</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              A new user has registered and is waiting for approval from guy@wershuffle.com:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${userName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
              <p style="margin: 5px 0;"><strong>Admin to approve:</strong> guy@wershuffle.com</p>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Please forward this to guy@wershuffle.com or log into your VCrm admin dashboard to approve this user.
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Note:</strong> To send emails directly to guy@wershuffle.com, please verify your domain at resend.com/domains and update the email function.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${Deno.env.get('SUPABASE_URL')}/dashboard" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Go to Admin Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
            <p>This is an automated notification from VCrm</p>
          </div>
        </div>
      `,
    });

    console.log("Admin notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Admin notification sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-admin function:", error);
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