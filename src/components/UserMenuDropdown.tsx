'use client'

import Link from 'next/link'
import { User, ChevronDown, LogOut, History, Crown } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuDropdownProps {
  user: SupabaseUser
  onSignOut: () => void
  showHistory?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function UserMenuDropdown({ user, onSignOut, showHistory = false, size = 'md' }: UserMenuDropdownProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'px-3 py-2',
          avatar: 'w-8 h-8',
          icon: 'w-4 h-4',
          text: 'text-xs',
        }
      case 'lg':
        return {
          button: 'px-6 py-4',
          avatar: 'w-12 h-12',
          icon: 'w-6 h-6',
          text: 'text-base',
        }
      default:
        return {
          button: 'px-4 py-3',
          avatar: 'w-10 h-10',
          icon: 'w-5 h-5',
          text: 'text-sm',
        }
    }
  }

  const classes = getSizeClasses()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-3 ${classes.button} bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:border-purple-200 transition-all duration-200 group`}
        >
          <div className={`${classes.avatar} bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center`}>
            <User className={`${classes.icon} text-purple-600`} />
          </div>
          <div className="text-left">
            <p className={`${classes.text} font-semibold text-gray-800 max-w-[120px] truncate`}>
              {user.email}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-all duration-200" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                {user.email}
              </p>
              <p className="text-xs text-gray-500 font-normal">Account Settings</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/subscription"
            className="flex items-center gap-3 cursor-pointer"
          >
            <Crown className="w-4 h-4" />
            View Subscription
          </Link>
        </DropdownMenuItem>

        {showHistory && (
          <DropdownMenuItem asChild>
            <Link
              href="/history"
              className="flex items-center gap-3 cursor-pointer"
            >
              <History className="w-4 h-4" />
              Generation History
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onSignOut}
          className="flex items-center gap-3 text-red-600 focus:text-red-600 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}