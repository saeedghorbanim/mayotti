import { useState } from "react";
import { User, Settings, CreditCard, FileText, Shield, LogOut } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditProfileDialog } from "./EditProfileDialog";
import { SettingsDialog } from "./SettingsDialog";
import { useProfile } from "@/hooks/useProfile";

interface ProfileMenuProps {
  onShowPaywall?: () => void;
}

export const ProfileMenu = ({ onShowPaywall }: ProfileMenuProps) => {
  const { profile } = useProfile();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label="Profile and settings" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
            <Avatar className="h-11 w-11 border border-border cursor-pointer transition-colors">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              ) : null}
              <AvatarFallback className="bg-card text-foreground text-sm font-bold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                Mayotti User
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowEditProfile(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="https://mayotti.com/terms" target="_blank" rel="noopener noreferrer" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span>Terms of Use</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="https://mayotti.com/privacy" target="_blank" rel="noopener noreferrer" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              <span>Privacy Policy</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProfileDialog 
        open={showEditProfile} 
        onOpenChange={setShowEditProfile} 
      />
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        onShowPaywall={onShowPaywall}
      />
    </>
  );
};
