import { forwardRef, HTMLAttributes, memo, useCallback, useRef, useState } from "react";
import { Photo, PhotoAlbum, PhotoProps } from "react-photo-album";
import clsx from "clsx";
import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";

import photoSet from "./photos";
import "./App.css";

// @dnd-kit requires string 'id' on sortable elements
interface SortablePhoto extends Photo {
    id: string;
}

type SortablePhotoProps = PhotoProps<SortablePhoto>;

type PhotoFrameProps = SortablePhotoProps & {
    overlay?: boolean;
    active?: boolean;
    insertPosition?: "before" | "after";
    sortableProps?: Partial<HTMLAttributes<HTMLDivElement>>;
};

const PhotoFrame = forwardRef<HTMLDivElement, PhotoFrameProps>((props, ref) => {
    const { layoutOptions, imageProps, overlay, active, insertPosition, sortableProps } = props;
    const { alt, style, ...restImageProps } = imageProps;

    return (
        <div
            ref={ref}
            style={{
                width: overlay ? `calc(100% - ${2 * layoutOptions.padding}px)` : style.width,
                padding: style.padding,
                marginBottom: style.marginBottom,
            }}
            className={clsx("photo-frame", {
                overlay: overlay,
                active: active,
                insertBefore: insertPosition === "before",
                insertAfter: insertPosition === "after",
            })}
            {...sortableProps}
        >
            <img
                alt={alt}
                style={{
                    ...style,
                    width: "100%",
                    height: "auto",
                    padding: 0,
                    marginBottom: 0,
                }}
                {...restImageProps}
            />
        </div>
    );
});
PhotoFrame.displayName = "PhotoFrame";

const MemoizedPhotoFrame = memo(PhotoFrame);

const SortablePhotoFrame = (props: SortablePhotoProps & { activeIndex?: number }) => {
    const { photo, activeIndex } = props;
    const { attributes, listeners, isDragging, index, over, setNodeRef } = useSortable({ id: photo.id });

    return (
        <MemoizedPhotoFrame
            ref={setNodeRef}
            active={isDragging}
            insertPosition={
                activeIndex !== undefined && over?.id === photo.id && !isDragging
                    ? index > activeIndex
                        ? "after"
                        : "before"
                    : undefined
            }
            aria-label="sortable image"
            sortableProps={{
                ...attributes,
                ...listeners,
            }}
            {...props}
        />
    );
};

const App = () => {
    const [photos, setPhotos] = useState(
        (photoSet as Photo[]).map((photo) => ({
            ...photo,
            id: photo.key || photo.src,
        }))
    );
    const renderedPhotos = useRef<{ [key: string]: SortablePhotoProps }>({});
    const [activeId, setActiveId] = useState(null);
    const activeIndex = activeId ? photos.findIndex((photo) => photo.id === activeId) : undefined;

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 50, tolerance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = useCallback(({ active }) => setActiveId(active.id), []);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setPhotos((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }, []);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={photos}>
                <div style={{ margin: 30 }}>
                    <PhotoAlbum
                        photos={photos}
                        layout="rows"
                        spacing={30}
                        padding={20}
                        renderPhoto={(props) => {
                            // capture rendered photos for future use in DragOverlay
                            renderedPhotos.current[props.photo.id] = props;
                            return <SortablePhotoFrame activeIndex={activeIndex} {...props} />;
                        }}
                    />
                </div>
            </SortableContext>
            <DragOverlay>{activeId && <PhotoFrame overlay {...renderedPhotos.current[activeId]} />}</DragOverlay>
        </DndContext>
    );
};

export default App;
