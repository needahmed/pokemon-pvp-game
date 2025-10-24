"use client"

export default function PokemonCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
      <div className="flex justify-center mb-2 h-24">
        <div className="skeleton w-24 h-24 rounded"></div>
      </div>
      
      <div className="skeleton h-4 w-3/4 mx-auto mb-2 rounded"></div>
      
      <div className="flex justify-center mt-2 gap-1">
        <div className="skeleton h-6 w-16 rounded"></div>
        <div className="skeleton h-6 w-16 rounded"></div>
      </div>
      
      <div className="skeleton h-3 w-12 mx-auto mt-2 rounded"></div>
    </div>
  );
}

export function PokemonCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <PokemonCardSkeleton key={index} />
      ))}
    </>
  );
}
