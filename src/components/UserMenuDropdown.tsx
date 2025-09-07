'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, ChevronDown, Settings, LogOut, History, Crown } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface UserMenuDropdownProps {
  user: SupabaseUser
  onSignOut: () => void
  showHistory?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function UserMenuDropdown({ user, onSignOut, showHistory = false, size = 'md' }: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'px-3 py-2',
          avatar: 'w-8 h-8',
          icon: 'w-4 h-4',
          text: 'text-xs',
          dropdown: 'w-56'
        }
      case 'lg':
        return {
          button: 'px-6 py-4',
          avatar: 'w-12 h-12',
          icon: 'w-6 h-6',
          text: 'text-base',
          dropdown: 'w-72'
        }
      default:
        return {
          button: 'px-4 py-3',
          avatar: 'w-10 h-10',
          icon: 'w-5 h-5',
          text: 'text-sm',
          dropdown: 'w-64'
        }
    }
  }

  const classes = getSizeClasses()

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full right-0 mt-2 ${classes.dropdown} bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
          
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500">Account Settings</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/subscription"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group"
            >
              <Crown className="w-4 h-4 group-hover:text-purple-600" />
              View Subscription
            </Link>

            {showHistory && (
              <Link
                href="/history"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
              >
                <History className="w-4 h-4 group-hover:text-blue-600" />
                Generation History
              </Link>
            )}

            <hr className="my-1 border-gray-100" />
            
            <button
              onClick={() => {
                setIsOpen(false)
                onSignOut()
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors group"
            >
              <LogOut className="w-4 h-4 group-hover:text-red-600" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}