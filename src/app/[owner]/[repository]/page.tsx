export default function Page() {
  // somehow get data

  return (
    <div className="p-4 mx-auto md:max-w-7xl w-full">
      <div className="w-full grid grid-cols-4 gap-8">
        {/* File Browser and README */}
        <div className="col-span-3 flex flex-col gap-4">
          <section>Readme goes here i think</section>
        </div>

        {/* Description / Metadata */}
        <div className="col-span-1">
          <section className="">
            <h2 className="font-bold">About</h2>
            <p>Repo Description</p>
          </section>
        </div>
      </div>
    </div>
  );
}
