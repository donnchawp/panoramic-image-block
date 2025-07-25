import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	MediaUpload,
	MediaUploadCheck,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	TextControl,
	Placeholder,
} from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';

export default function Edit( { attributes, setAttributes } ) {
	const { images, altText } = attributes;
	const canvasRef = useRef( null );

	const onSelectImages = ( media ) => {
		const selectedImages = media.slice( 0, 3 ).map( ( item ) => ( {
			id: item.id,
			url: item.url,
			alt: item.alt || '',
		} ) );
		setAttributes( { images: selectedImages } );
	};

	const removeImage = ( index ) => {
		const newImages = [ ...images ];
		newImages.splice( index, 1 );
		setAttributes( { images: newImages } );
	};

	const stitchImages = () => {
		if ( images.length !== 3 || ! canvasRef.current ) {
			return;
		}

		const canvas = canvasRef.current;
		const ctx = canvas.getContext( '2d' );

		Promise.all(
			images.map( ( img ) => {
				return new Promise( ( resolve ) => {
					const image = new Image();
					image.crossOrigin = 'anonymous';
					image.onload = () => resolve( image );
					image.src = img.url;
				} );
			} )
		).then( ( loadedImages ) => {
			const maxHeight = Math.max(
				...loadedImages.map( ( img ) => img.height )
			);
			const totalWidth = loadedImages.reduce(
				( sum, img ) => sum + img.width,
				0
			);

			canvas.width = totalWidth;
			canvas.height = maxHeight;

			let x = 0;
			loadedImages.forEach( ( img ) => {
				const y = ( maxHeight - img.height ) / 2;
				ctx.drawImage( img, x, y );
				x += img.width;
			} );
		} );
	};

	useEffect( () => {
		if ( images.length === 3 ) {
			stitchImages();
		}
	}, [ images ] );

	const blockProps = useBlockProps( {
		className: 'panoramic-image-block-editor',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Panoramic Settings', 'panoramic-image-block' ) }>
					<TextControl
						label={ __( 'Alt Text', 'panoramic-image-block' ) }
						value={ altText }
						onChange={ ( value ) =>
							setAttributes( { altText: value } )
						}
						help={ __(
							'Describe the panoramic image for screen readers.',
							'panoramic-image-block'
						) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ images.length < 3 ? (
					<Placeholder
						icon="format-gallery"
						label={ __( 'Panoramic Image', 'panoramic-image-block' ) }
						instructions={ __(
							'Select 3 images to create a panoramic view.',
							'panoramic-image-block'
						) }
					>
						<MediaUploadCheck>
							<MediaUpload
								onSelect={ onSelectImages }
								allowedTypes={ [ 'image' ] }
								multiple={ true }
								gallery={ true }
								value={ images.map( ( img ) => img.id ) }
								render={ ( { open } ) => (
									<Button onClick={ open } variant="primary">
										{ images.length === 0
											? __(
													'Select Images',
													'panoramic-image-block'
											  )
											: __(
													`Add ${
														3 - images.length
													} more image${
														3 - images.length > 1
															? 's'
															: ''
													}`,
													'panoramic-image-block'
											  ) }
									</Button>
								) }
							/>
						</MediaUploadCheck>
					</Placeholder>
				) : (
					<div className="panoramic-image-block-preview">
						<div className="panoramic-images-grid">
							{ images.map( ( image, index ) => (
								<div
									key={ image.id }
									className="panoramic-image-item"
								>
									<img src={ image.url } alt={ image.alt } />
									<Button
										onClick={ () => removeImage( index ) }
										variant="secondary"
										isDestructive
										size="small"
									>
										{ __( 'Remove', 'panoramic-image-block' ) }
									</Button>
								</div>
							) ) }
						</div>

						<div className="panoramic-stitched-preview">
							<h4>{ __( 'Stitched Preview:', 'panoramic-image-block' ) }</h4>
							<canvas
								ref={ canvasRef }
								style={ { maxWidth: '100%', height: 'auto' } }
							/>
						</div>

						<MediaUploadCheck>
							<MediaUpload
								onSelect={ onSelectImages }
								allowedTypes={ [ 'image' ] }
								multiple={ true }
								gallery={ true }
								value={ images.map( ( img ) => img.id ) }
								render={ ( { open } ) => (
									<Button
										onClick={ open }
										variant="secondary"
									>
										{ __( 'Replace Images', 'panoramic-image-block' ) }
									</Button>
								) }
							/>
						</MediaUploadCheck>
					</div>
				) }
			</div>
		</>
	);
}
