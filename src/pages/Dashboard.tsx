import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Project {
  id: string;
  title: string;
  description: string;
  video_url: string;
  created_at: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
    fetchProjects();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
    }
  }

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setProjects(data);
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Profile Summary */}
        {profile && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile.full_name}
            </h2>
            <p className="mt-1 text-gray-600">
              Subscription: {profile.subscription_tier}
              {profile.subscription_tier === 'trial' && (
                <span className="ml-2 text-indigo-600">
                  Trial ends: {format(new Date(profile.trial_end_date), 'PP')}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Projects List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Your Projects</h3>
            <button
              onClick={() => {/* Handle new project */}}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
            >
              New Project
            </button>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {projects.map((project) => (
                <li key={project.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {project.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {/* Handle edit */}}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {/* Handle delete */}}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Created {format(new Date(project.created_at), 'PP')}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}